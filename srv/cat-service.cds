using padaria as my from '../db/schema';

service CatalogService {
    entity Coletas as projection on my.Coletas;
    entity Pedidos as projection on my.Pedidos;
    entity Acompanhamentos as projection on my.Acompanhamentos;
    entity Status as projection on my.Status;
}
