const cds = require('@sap/cds');
const { expand } = require('@sap/cds/lib/ql/cds-ql');
// const { Coletas, Pedidos, Acompanhamentos, Status } = require('@cds-models/CatalogService')

module.exports = class CatalogService extends cds.ApplicationService { async init() {
  const { Coletas, Pedidos, Acompanhamentos, Status } = cds.entities('CatalogService');
// -----------------------------------------------------------------------
// # Coletas
// -----------------------------------------------------------------------

  this.before('DELETE', Coletas, async (req) => {        
    const coleta = await this.verificarColeta(Coletas, Acompanhamentos, req, req.data.ID);  
    if (coleta == undefined) {return req.reject(400, "Essa coleta não é possível de ser apagada")};
  });

  // Validações no caso de criação e atualização (responsável pela aplicação das regras de negócio)
  this.before (['CREATE', 'UPDATE'], Coletas, async (req) => { 
    // Verificação se existe algum pedido atrelado a Coleta
    if (req.data.pedidos.length == 0) { return req.reject(400, "É necessário que a coleta esteja atrelada a algum pedido"); };

    // Alteração do status do acompanhamento para criada (entendi que a data_comentario seja equivalente a data que ocorreu a atualização de um status)
    const acompanhamentoStru = {
      "data_comentario": new Date(),
      "status": {
        "status": "Criada"
      }
    }
    req.data.acompanhamento[0] = acompanhamentoStru;
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
      const returnValue = await this.encaminharColeta(Coletas, Acompanhamentos, req, req.params[0], req.data.transportadora);
      if (returnValue.statusCode != 200) {
        return req.reject(returnValue.statusCode, returnValue.message);        
      };

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
}

// -----------------------------------------------------------------------
// # encaminharColeta
// -----------------------------------------------------------------------
// Método responsável pelo encaminhamento da Coleta (realiza as verificações de negócio) 
// -----------------------------------------------------------------------
// Inputs <<
// << Coletas - Entidade Coletas
// << Acompanhamentos - Entidade Acompanhamentos
// << req - Requisição
// << ID - ID da Coleta para fazer a busca na entidade
// << carrier - Nome da transportadora para ser atribuída
// -----------------------------------------------------------------------
// Outputs >>
// >> returnStruc - Estrutura de saída com o Status Code e a mensagem para validação
// -----------------------------------------------------------------------
  async encaminharColeta(Coletas, Acompanhamentos, req, ID, carrier) {          
      let returnStruc = {
        "statusCode": 200,
        "message": ""
      };
    
      // Buscar coleta para validações      
      try {   
      const coleta = await this.verificarColeta(Coletas, Acompanhamentos, req, ID);  
      if (coleta == undefined) {return req.reject(400, "Não foi possível realizar o encaminhamento dessa coleta")};
            
      const resultUpdateCol = await UPDATE(Coletas).set({transportadora: carrier}).where({ID: ID});
      const resultUpdateAcom = await UPDATE(Acompanhamentos).set({status_status: 'Encaminhada', data_comentario: new Date()}).where({id_ID: ID});
      if (resultUpdateCol == 0 || resultUpdateAcom == 0) {
        returnStruc.statusCode = 406;
        returnStruc.message = "Ocorreu um erro ao tentar realizar a atualização das entidades";
      }
      } catch (error) {
        
      }
      return returnStruc;
      
  }

// -----------------------------------------------------------------------
// # verificarColeta
// -----------------------------------------------------------------------
// Método responsável por verificar os seguintes pontos: Se existe uma coleta com esse ID, se ela possui o status "Criada" e se essa coleta foi criada por esse usuário
// -----------------------------------------------------------------------
// Inputs <<
// << Coletas - Entidade Coletas
// << Acompanhamentos - Entidade Acompanhamentos
// << req - Requisição
// << ID - ID da Coleta para fazer a busca na entidade
// -----------------------------------------------------------------------
// Outputs >>
// >> coleta - Estrutura de saída que vai ser o resultado do SELECT da coleta
// -----------------------------------------------------------------------  
  async verificarColeta(Coletas, Acompanhamentos, req, ID) {
    const coleta = await SELECT.one
                          .from(`${Coletas.name} as A`)                      
                          .join(`${Acompanhamentos.name} as B`)
                          .on(`A.ID = B.ID_id and B.status_status = 'Criada'`)
                          .columns(`A.ID`)
                          .where(`ID = '${ID}' and createdBy = '${req.user.id}'`);    // Ajustar depois esse req.data.ID com esse filtro para evitar SQL Inject    
    return coleta;                          
  };

}
