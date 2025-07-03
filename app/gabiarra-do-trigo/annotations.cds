using CatalogService as service from '../../srv/cat-service';
annotate service.Coletas with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'cnpj_fornecedor',
                Value : cnpj_fornecedor,
            },
            {
                $Type : 'UI.DataField',
                Label : 'transportadora',
                Value : transportadora,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'cnpj_fornecedor',
            Value : cnpj_fornecedor,
        },
        {
            $Type : 'UI.DataField',
            Label : 'transportadora',
            Value : transportadora,
        },
    ],
);

