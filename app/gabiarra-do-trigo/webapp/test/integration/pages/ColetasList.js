sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'gabiarradotrigo',
            componentId: 'ColetasList',
            contextPath: '/Coletas'
        },
        CustomPageDefinitions
    );
});