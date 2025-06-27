const cds = require('@sap/cds');
const { expand } = require('@sap/cds/lib/ql/cds-ql');
// const { Coletas, Pedidos, Acompanhamentos, Status } = require('@cds-models/CatalogService')

module.exports = class CatalogService extends cds.ApplicationService { async init() {
  const { Coletas, Pedidos, Acompanhamentos, Status } = cds.entities('CatalogService');
// -----------------------------------------------------------------------
// # Coletas
// -----------------------------------------------------------------------
    
  this.before (['CREATE', 'UPDATE'], Coletas, async (req) => { 
    // Verificação se existe algum pedido atrelado a Coleta
    if (req.data.pedidos.length == 0) { return req.reject(400, "É necessário que a coleta esteja atrelada a algum pedido"); };

    // Alteração do status do acompanhamento para criada (entendi que a data_comentario seja equivalente a data que ocorreu a atualização de um status)
    if (req.data.acompanhamento[0].status.status != null) {
      req.data.acompanhamento[0].status.status = 'Criada';
      req.data.acompanhamento[0].data_comentario = new Date();
    };
    
    // Lógica para verificação se já existe alguma coleta atrelada a esses pedidos em um status válido
    const numero_pedidos = req.data.pedidos.map((element) => {return element.numero_pedido})
    
    const coletas = await SELECT
                    .from(Coletas)                    
                    .columns(c => { c.pedidos`[numero_pedido in ${numero_pedidos}]`(ped => {ped`.*`}),
                                    c.acompanhamento`[status_status != 'Rejeitada']`(acom => {acom`.*`})
                                  });   
    
    coletas.forEach(element => {           
      if (element.pedidos.length != 0 && element.acompanhamento != null) {
        return req.reject(402, "Já existe uma coleta atrelada a esse pedido!"); ;
      }
    });    
    
  })
  // Método de encaminhamento de Coleta.
  this.on('fowardCollect', Coletas, async (req) => {
      const ID  = req.params[0];
      // Buscar coleta para validações      
      const coleta = await SELECT.one
                    .from(Coletas)
                    .columns('*', expand('acompanhamento'))
                    .where({ID});      
      
      if (coleta == null) {return req.reject(400, "Nenhuma coleta foi encontrada para esse ID!")};
      if (coleta.acompanhamento.status_status != 'Criada') {return req.reject(402, "O encaminhamento pode acontecer apenas com o status 'Criada' ")};
      if (coleta.createdBy != req.user.id) {return req.reject(403, "Apenas o usuário que criou a Coleta pode encaminhar")};
      
      const resultUpdateCol = await UPDATE(Coletas).set({transportadora: req.data.transportadora}).where({ID: ID});
      const resultUpdateAcom = await UPDATE(Acompanhamentos).set({status_status: 'Encaminhada', data_comentario: new Date()}).where({id_ID: ID});
      
      console.log(resultUpdateCol);
      console.log(resultUpdateAcom);

  })
  
  this.after(['CREATE', 'UPDATE'], Coletas, async (coletas, req) => {
    // console.log(coletas.acompanhamento[0].status_status);
    // coletas.acompanhamento[0].status_status = 'Criada';
    console.log("teste");
  })
      
// -----------------------------------------------------------------------
// # Pedidos
// -----------------------------------------------------------------------
  
  this.before (['CREATE', 'UPDATE'], Pedidos, async (req) => {
    console.log('Before CREATE/UPDATE Pedidos', req.data)
  })
  this.after ('READ', Pedidos, async (pedidos, req) => {
    console.log('After READ Pedidos', pedidos)
  })
  
// -----------------------------------------------------------------------
// # Acompanhamentos
// -----------------------------------------------------------------------
   
  this.before (['CREATE', 'UPDATE'], Acompanhamentos, async (req) => {
    console.log('Before CREATE/UPDATE Acompanhamentos', req.data)
  })
  this.after ('READ', Acompanhamentos, async (acompanhamentos, req) => {
    console.log('After READ Acompanhamentos', acompanhamentos)
  })

// -----------------------------------------------------------------------
// # Status
// -----------------------------------------------------------------------
  
  this.before (['CREATE', 'UPDATE'], Status, async (req) => {
    console.log('Before CREATE/UPDATE Status', req.data)
  })
  this.after ('READ', Status, async (status, req) => {
    console.log('After READ Status', status)
  })


  return super.init()
}}
