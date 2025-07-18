const cds = require('@sap/cds');
const { expand } = require('@sap/cds/lib/ql/cds-ql');
// const { Coletas, Pedidos, Acompanhamentos, Status } = require('@cds-models/CatalogService')

module.exports = class CatalogService extends cds.ApplicationService { async init() {
  const { Coletas, Pedidos, Acompanhamentos, Status } = cds.entities('CatalogService');  
  const api = await cds.connect.to('Brasil.API');
  const i18n = cds.i18n.messages;
// -----------------------------------------------------------------------
// # Coletas
// -----------------------------------------------------------------------

  this.before('DELETE', Coletas, async (req) => {        
    const coleta = await this.verificarColeta(Coletas, Acompanhamentos, req, req.data.ID, 'Criada');
    console.log(coleta);  
    if (coleta == undefined) {return req.reject(400, i18n.at("ERROR_DELETE_COLLECT", req.locale))};
  });
  
  // Validações no caso de criação e atualização (responsável pela aplicação das regras de negócio)
  // Atualizar essa parte depois!!
  this.before (['CREATE', 'UPDATE'], Coletas, async (req) => { 
    // console.log(req.params);
    // // Verificação se existe algum pedido atrelado a Coleta
    // if (req.data.pedidos.length == 0) { return req.reject(400, i18n.at("ERROR_COLLECT_WITHOUT_DEMANDS", req.locale)); };

    // // Alteração do status do acompanhamento para criada (entendi que a data_comentario seja equivalente a data que ocorreu a atualização de um status)
    // const acompanhamentoStru = {
    //   "data_comentario": new Date(),
    //   "status": {
    //     "status": "Criada"
    //   }
    // }
    // req.data.acompanhamento[0] = acompanhamentoStru;

    // req.data.transportadora = ""; // Deixar vazio mesmo que seja fornecido a transportadora 
    // try {
    //   console.log(req.data.cnpj_fornecedor);
    //   const { cnpj: cnpj } = await api.get(`/cnpj/v1/${req.data.cnpj_fornecedor}`);      
    // } catch (error) {
    //   return req.reject(400, i18n.at("ERROR_INVALID_CNPJ", req.locale))
    // }
    
    // Verificação de irregularidades no Body (N° Pedidos > 0 e CNPJ válido)
    const returnVBody = await this.verificarIrregularidadeBody(req.data, api);
    if (returnVBody.statusCode != 200) {
      return req.reject(returnVBody.statusCode, i18n.at(returnVBody.message, req.locale) );        
    };

    // Verificação de irregularidades na lógica de entidade (entidade já existe ou já existe algum pedido atrelado a uma outra coleta)
    const returnVEnti = await this.verificarIrregularidadeEntidade(Coletas, req.data);
    if (returnVEnti.statusCode != 200) {
      return req.reject(returnVBody.statusCode, i18n.at(returnVBody.message, req.locale) );        
    };

    // Modificar o conteúdo do body para tratamento e adequação
    this.modificarBodyCriacao(req.data);

    // // Verificar se a coleta já existe (deve ser inserido antes da análise de pedidos atrelado a coleta)
    // const coleta = await SELECT.from(Coletas).where({ID: req.data.ID})
    // if (coleta.length > 0) { return req.reject(400, i18n.at("ERROR_COLLECT_ALREADY_EXISTS", req.locale)); };

    // // Lógica para verificação se já existe alguma coleta atrelada a esses pedidos em um status válido
    // const numero_pedidos = req.data.pedidos.map((element) => {return element.numero_pedido})
    
    // const coletas = await SELECT
    //                 .from(Coletas)                    
    //                 .columns(c => { c.pedidos`[numero_pedido in ${numero_pedidos}]`(ped => {ped`.*`}),
    //                                 c.acompanhamento`[status_status != 'Rejeitada']`(acom => {acom`.*`})
    //                               });   
    
    // coletas.forEach(element => {           
    //   if (element.pedidos.length != 0 && element.acompanhamento != null) {
    //     return req.reject(402, i18n.at("ERROR_COLLECT_REPEATED_DEMANDS", req.locale)); ;
    //   }
    // }); 
    
    // const keys = Object.keys(response);
    // console.log(response);

               

  })

  // Método de encaminhamento de Coleta.
  this.on('fowardCollect', Coletas, async (req) => {
      console.log(req.params[0]);
      const returnValue = await this.encaminharColeta(Coletas, Acompanhamentos, req, req.params[0].ID, req.data.transportadora);
      if (returnValue.statusCode != 200) {
        return req.reject(returnValue.statusCode, i18n.at(returnValue.message, req.locale) );        
      };

  })
  
  // Método de Aceitar ou Rejeitar a Coleta
  this.on('respondCollect', Coletas, async (req) => {
    let status;
    req.data.action == "Accept" ? status = "Aceita" : status = "Rejeitada";
    console.log(req.user);
    console.log(req.user.roles);
    console.log(req.params[0]);
    const result = await this.responderColeta(Coletas, Acompanhamentos, req.params[0].ID, req.user.id,  status)
    if (result.statusCode != 200) {
      return req.reject(result.statusCode, i18n.at(result.message, req.locale) );        
    };
    
  });

  // Método de Coletar a coleta
  this.on('finishCollect', Coletas, async (req) => {
    const result = await this.coletarColeta(Coletas, Acompanhamentos, req.user.id, req.params[0].ID);
    if (result.statusCode != 200) {
      return req.reject(result.statusCode, i18n.at(result.message, req.locale) ); 
    };
  });


  this.on('READ', Coletas, async(req) => {        
    const acompanhamentoRef = { ref: [ 'acompanhamento' ], expand: [ '*' ] };
    // Essa restrição vai fazer com que seja apenas aplicado no caso do GET, o que evita que seja aplicado para os outros casos de SELECT no UPDATE.
    if (req.res != undefined) {      
      console.log(req.user.roles);
      // Incluir a expansão do acompanhamento de forma automática
      acompanhamentoRef in req.query.SELECT.columns ? "" : req.query.SELECT.columns.push(acompanhamentoRef) ;
      
      // if (req.user.roles.hasOwnProperty('carrier')) {        
      //   console.log(req.query.SELECT);
      //   req.query.SELECT.where = [{ ref: ['transportadora'] }, '=', { val: req.user.attr.carrier }];
      //   console.log(req.query.SELECT);
      // } else if (req.user.roles.hasOwnProperty('vendor')) {
      //   req.query.SELECT.where = [{ ref: ['createdBy'] }, '=', { val: req.user.id }];
      // }
      
      req.user.roles.hasOwnProperty('carrier') ? req.query.SELECT.where = [{ ref: ['transportadora'] }, '=', { val: req.user.id }] : req.query.SELECT.where = [{ ref: ['createdBy'] }, '=', { val: req.user.id }] ;      
      const results = cds.run(req.query);      
      return results;
    }
  })

  this.after(['CREATE', 'UPDATE'], Coletas, async (coletas, req) => {
    // console.log(coletas.acompanhamento[0].status_status);
    // coletas.acompanhamento[0].status_status = 'Criada';
    console.log("teste");
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
      const coleta = await this.verificarColeta(Coletas, Acompanhamentos, req, ID, 'Criada');  
      // if (coleta == undefined) {return req.reject(400, "Não foi possível realizar o encaminhamento dessa coleta")};
      if (coleta == undefined) {
        returnStruc.statusCode = 400;
        returnStruc.message = "ERROR_FOWARDING_COLLECT";    
        return returnStruc;    
      };      
      const resultUpdateCol = await UPDATE(Coletas).set({transportadora: carrier}).where({ID: ID});
      const resultUpdateAcom = await UPDATE(Acompanhamentos).set({status_status: 'Encaminhada', data_comentario: new Date()}).where({id_ID: ID});
      if (resultUpdateCol == 0 || resultUpdateAcom == 0) {
        returnStruc.statusCode = 406;
        returnStruc.message = "ERROR_UPDATING_ENTITY";
      }
      } catch (error) {
        returnStruc.statusCode = 400;
        returnStruc.message = error;
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

// -----------------------------------------------------------------------
// # responderColeta
// -----------------------------------------------------------------------
// Método responsável por informar se aceita ou rejeita a Coleta por parte do transportador 
// -----------------------------------------------------------------------
// Inputs <<
// << Coletas - Entidade Coletas
// << Acompanhamentos - Entidade Acompanhamentos
// << ID - ID da Coleta para fazer a busca na entidade
// << carrier - Nome da transportadora para ser atribuída
// << status  - Status da coleta 
// -----------------------------------------------------------------------
// Outputs >>
// >> returnStruc - Estrutura de saída com o Status Code e a mensagem para validação
// -----------------------------------------------------------------------
async responderColeta(Coletas, Acompanhamentos, ID, carrier, status) {          
  let returnStruc = {
    "statusCode": 200,
    "message": ""
  };
   try {
  console.log(carrier)
    
    // const coleta = await SELECT.one
    //                       .from(`${Coletas.name} as A`)                      
    //                       .join(`${Acompanhamentos.name} as B`)
    //                       .on(`A.ID = B.ID_id and B.status_status = 'Encaminhada'`)
    //                       .columns(`A.ID`)
    //                       .where(`ID = '${ID}' and transportadora = '${carrier}'`);    // Ajustar depois esse req.data.ID com esse filtro para evitar SQL Inject 
  const coleta = await this.buscarColetaTransportadora(Coletas, Acompanhamentos, ID, carrier, 'Encaminhada');
  console.log(coleta);
  if (coleta == undefined) {
    returnStruc.statusCode = 400;
    returnStruc.message = "ERROR_COLLECT_NOT_FOUND";
    return returnStruc;
  };

   const resultUpdateAcom = await UPDATE(Acompanhamentos).set({status_status: status, data_comentario: new Date()}).where({id_ID: ID});
   if (resultUpdateAcom == 0) {
     returnStruc.statusCode = 402;
     returnStruc.message = "ERROR_UPDATING_ENTITY";
   };
    
   } catch (error) {
    returnStruc.statusCode = 400;
    returnStruc.message = error;
   }
  return returnStruc;
}

// -----------------------------------------------------------------------
// # buscarColetaTransportadora
// -----------------------------------------------------------------------
// Método responsável por obter a Coleta encaminhada para o transportador
// -----------------------------------------------------------------------
// Inputs <<
// << Coletas - Entidade Coletas
// << Acompanhamentos - Entidade Acompanhamentos
// << carrier - Nome da transportadora para ser atribuída
// -----------------------------------------------------------------------
// Outputs >>
// >> coleta - Estrutura de saída que vai ser o resultado do SELECT da coleta
// -----------------------------------------------------------------------  
async buscarColetaTransportadora(Coletas, Acompanhamentos,  ID, carrier, status) {
  const coleta = await SELECT.one
                          .from(`${Coletas.name} as A`)                      
                          .join(`${Acompanhamentos.name} as B`)
                          .on(`A.ID = B.ID_id and B.status_status = '${status}'`)
                          .columns(`A.ID`)
                          .where(`ID = '${ID}' and transportadora = '${carrier}'`);
  return coleta;                          
};

// -----------------------------------------------------------------------
// # coletarColeta
// -----------------------------------------------------------------------
// Método responsável coletar a coleta que foi aceita
// -----------------------------------------------------------------------
// Inputs <<
// << Coletas - Entidade Coletas
// << Acompanhamentos - Entidade Acompanhamentos
// << carrier - Nome da transportadora para ser atribuída
// << ID - ID da Coleta
// -----------------------------------------------------------------------
// Outputs >>
// >> returnStruc - Estrutura de saída com o Status Code e a mensagem para validação
// -----------------------------------------------------------------------  

async coletarColeta(Coletas, Acompanhamentos, carrier, ID) {
  // ID = req.params[0]
  let returnStruc = {
    "statusCode": 200,
    "message": ""
  };
  try {
    const coleta = await this.buscarColetaTransportadora(Coletas, Acompanhamentos, ID, carrier,  'Aceita');
    if (coleta == undefined) {
      returnStruc.statusCode = 400;
      returnStruc.message = "ERROR_COLLECT_NOT_FOUND";
      return returnStruc;
    };
    const resultUpdateAcom = await UPDATE(Acompanhamentos).set({status_status: 'Coletada', data_comentario: new Date()}).where({id_ID: ID});
    if (resultUpdateAcom == 0) {
      returnStruc.statusCode = 402;
      returnStruc.message = "ERROR_UPDATING_ENTITY";
    };
  } catch (error) {
    returnStruc.statusCode = 400;
    returnStruc.message = error;
  }
  
  return returnStruc;
}

// -----------------------------------------------------------------------
// # verificarIrregularidadeBody
// -----------------------------------------------------------------------
// Método responsável por realizar as verificações de irregularidade no Body no processo de Criação/Atualização da Coleta
// -----------------------------------------------------------------------
// Inputs <<
// << body - Conteúdo do body
// << api - Estrutura para conexão com API
// -----------------------------------------------------------------------
// Outputs >>
// >> returnStruc - Estrutura de saída com o Status Code e a mensagem para validação
// -----------------------------------------------------------------------  
async verificarIrregularidadeBody(body, api) {
  let returnStruc = {
    "statusCode": 200,
    "message": ""
  };
  // Verificação se existe algum pedido atrelado a Coleta
  if (body.pedidos.length == 0) { 
    //return req.reject(400, i18n.at("ERROR_COLLECT_WITHOUT_DEMANDS", req.locale)); 
    returnStruc.statusCode = 400;
    returnStruc.message = "ERROR_COLLECT_WITHOUT_DEMANDS";
    return returnStruc;
  };
  
  // Verificar se o CNPJ é válido
  try {
    const { cnpj: cnpj } = await api.get(`/cnpj/v1/${body.cnpj_fornecedor}`);      
  } catch (error) {
    //return req.reject(400, i18n.at("ERROR_INVALID_CNPJ", req.locale))
    returnStruc.statusCode = 400;
    returnStruc.message = "ERROR_INVALID_CNPJ";
  }
  return returnStruc                       
};

// -----------------------------------------------------------------------
// # verificarIrregularidadeEntidade
// -----------------------------------------------------------------------
// Método responsável por realizar as verificações de irregularidade na lógica de entidades no processo de Criação/Atualização da Coleta
// -----------------------------------------------------------------------
// Inputs <<
// << Coletas - Entidade Coletas
// << body - Conteúdo do body
// -----------------------------------------------------------------------
// Outputs >>
// >> returnStruc - Estrutura de saída com o Status Code e a mensagem para validação
// -----------------------------------------------------------------------  
async verificarIrregularidadeEntidade(Coletas, body) {
  let returnStruc = {
    "statusCode": 200,
    "message": ""
  };

  // Verificar se a coleta já existe (deve ser inserido antes da análise de pedidos atrelado a coleta)
  const coleta = await SELECT.from(Coletas).where({ID: body.ID})
  if (coleta.length > 0) { 
    // return req.reject(400, i18n.at("ERROR_COLLECT_ALREADY_EXISTS", req.locale)); 
    returnStruc.statusCode = 400;
    returnStruc.message = "ERROR_COLLECT_ALREADY_EXISTS";
    return returnStruc; 
  };

  // Lógica para verificação se já existe alguma coleta atrelada a esses pedidos em um status válido
  const numero_pedidos = body.pedidos.map((element) => {return element.numero_pedido})
  
  const coletas = await SELECT
                  .from(Coletas)                    
                  .columns(c => { c.pedidos`[numero_pedido in ${numero_pedidos}]`(ped => {ped`.*`}),
                                  c.acompanhamento`[status_status != 'Rejeitada']`(acom => {acom`.*`})
                                });   
  
  coletas.forEach(element => {           
    if (element.pedidos.length != 0 && element.acompanhamento != null) {
      // return req.reject(402, i18n.at("ERROR_COLLECT_REPEATED_DEMANDS", req.locale));
      returnStruc.statusCode = 402;
      returnStruc.message = "ERROR_COLLECT_REPEATED_DEMANDS"
      return returnStruc;
    }
  });
  return returnStruc; 
};
// -----------------------------------------------------------------------
// # modificarBodyCriacao
// -----------------------------------------------------------------------
// Método responsável por modificar o body no processo de Criação/Atualização da Coleta
// -----------------------------------------------------------------------
// Inputs <<
// << body - Conteúdo do body
// -----------------------------------------------------------------------
// Outputs >>
// >> 
// -----------------------------------------------------------------------  
modificarBodyCriacao(body) {
  const acompanhamentoStru = {
    "data_comentario": new Date(),
    "status": {
      "status": "Criada"
    }
  }

  // Alterar o Status para Criada e colocar a data de hoje, independente do input do usuário
  body.acompanhamento[0] = acompanhamentoStru;

  // Remover o conteúdo de transportadora para evitar problemas em processos de leitura futuros
  body.transportadora = "";
};

}