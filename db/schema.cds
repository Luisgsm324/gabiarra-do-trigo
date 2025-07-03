using { cuid, managed } from '@sap/cds/common';
namespace padaria;

entity Coletas : cuid, managed {
  cnpj_fornecedor : String;
  transportadora : String;
  pedidos: Composition of many Pedidos on pedidos.id = $self; 
  acompanhamento: Composition of one Acompanhamentos on acompanhamento.id = $self; 
}

entity Pedidos {
  id: Association to Coletas; // Pelo visto, é possível ter mais de uma coleta associada a um pedido portanto que não esteja em um status válido. Válido != 'Rejeitada'
  key numero_pedido: String;
  key item_pedido: String;
  valor_pedido: Decimal;
}

entity Acompanhamentos {
  key id: Association to Coletas;
  data_comentario : DateTime; 
  status: Association to Status; 
}

entity Status {
  key status: String @assert.range enum {
      created = 'Criada';
      forwarded = 'Encaminhada';
      accepted = 'Aceita';
      rejected = 'Rejeitada';
      colected = 'Coletada';
  };
  descricao: String;
}
