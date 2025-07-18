using padaria as my from '../db/schema';

service CatalogService {
    entity Coletas as projection on my.Coletas actions {
        action fowardCollect @(restrict: [{ to: 'vendor' }]) ( transportadora: String) returns Map; 
        action respondCollect @(restrict: [{ to: 'carrier' }]) ( action: String ) returns Map;
        action finishCollect @(restrict: [{ to: 'carrier' }]) ( ) returns Map;                         
    };

    entity Pedidos as projection on my.Pedidos;
    entity Acompanhamentos as projection on my.Acompanhamentos;
    entity Status as projection on my.Status;
}

annotate CatalogService with @requires: 'authenticated-user';

annotate CatalogService.Coletas with @restrict: [
    {grant: ['CREATE', 'UPDATE', 'READ', 'DELETE'], to: 'vendor'}, // A restrição da Criação da Coleta
    {grant: ['READ'], to: 'carrier'} // Ajustar isso aqui depois
];