sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'gabiarradotrigo/test/integration/FirstJourney',
		'gabiarradotrigo/test/integration/pages/ColetasList',
		'gabiarradotrigo/test/integration/pages/ColetasObjectPage',
		'gabiarradotrigo/test/integration/pages/PedidosObjectPage'
    ],
    function(JourneyRunner, opaJourney, ColetasList, ColetasObjectPage, PedidosObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('gabiarradotrigo') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheColetasList: ColetasList,
					onTheColetasObjectPage: ColetasObjectPage,
					onThePedidosObjectPage: PedidosObjectPage
                }
            },
            opaJourney.run
        );
    }
);