App = {

    contracts: {},
    web3Provider: null,             // Web3 provider
    url: 'http://localhost:8545',   // Url for web3
    account: '0x0',                 // current ethereum account

    init: function() {

        return App.initWeb3();
    },

    /* initialize Web3 */
    initWeb3: function() {
        console.log("Entered")
        // console.log(web3);
        
        if(typeof web3 != 'undefined') {
//            App.web3Provider = web3.currentProvider;
//            web3 = new Web3(web3.currentProvider);
            App.web3Provider = window.ethereum; // !! new standard for modern eth browsers (2/11/18)
            web3 = new Web3(App.web3Provider);
            try {
                    ethereum.enable().then(async() => {
                        console.log("DApp connected to Metamask");
                    });
            }
            catch(error) {
                console.log(error);
            }
        } else {
            App.web3Provider = new Web3.providers.HttpProvider(App.url); // <==
            web3 = new Web3(App.web3Provider);
        }

        return App.initContract();
    },

    /* Upload the contract's abstractions */
    initContract: function() {

        $("#alert").hide();

        // Get current account
        web3.eth.getCoinbase(function(err, account) {
            if(err == null) {
                App.account = account;
                $("#accountId").html("Your address: " + account);
            }
        });

        // Load content's abstractions
        $.getJSON("Lottery.json").done(function(c) {
            App.contracts["Contract"] = TruffleContract(c);
            App.contracts["Contract"].setProvider(App.web3Provider);

            return App.listenForEvents();
        });
    },

    // Write an event listener
    listenForEvents: function() {

        App.contracts["Contract"].deployed().then(async (instance) => {

        // web3.eth.getBlockNumber(function (error, block) {
            // click is the Solidity event
            instance.StartLottery().on('data', function (event) {
                console.log("Event Start Lottery");
                console.log(event);
                console.log("app: "+ App.account);
                console.log("event: "+ event.returnValues.owner);
                if (App.account == event.returnValues.owner.toLowerCase()){
                    $("#eventMessage").html("Lottery created");
                    $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                        $("#alert").slideUp(500);
                    });
                }
            });
            instance.BuyTicket().on('data', function (event) {
                console.log("Event buy ticket");
                console.log(event);
                console.log("app: "+ App.account);
                console.log("event: "+event.returnValues.owner);
                if (App.account === event.returnValues.owner.toLowerCase()){
                    $("#eventMessage").html("Success! Ticket bought");
                    $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                        $("#alert").slideUp(500);
                    });
                }
            });
            instance.OpenRound().on('data', function (event) {
                console.log("Event open round");
                console.log(event);
                $("#eventEnd").html(event.returnValues.roundEnds);
            });
            instance.CloseRound().on('data', function (event) {
                console.log("Event close round");
                console.log(event);
                $("#eventWin").html(event.returnValues.winningNumbers);
            });
            instance.NFTPrizeWon().on('data', function (event) {
                console.log("Event prize won");
                console.log(event);
                $("#eventNFTwinner").html(event.returnValues.winner);
                $("#eventNFTtoken").html(event.returnValues.NFTtoken);
                $("#eventNFTclass").html(event.returnValues.nftClass);
            });
            instance.CloseContract().on('data', function (event) {
                console.log("Contract closed");
                console.log(event);
            });

        });

        return App.render();
    },

    // Get a value from the smart contract
    render: function() {
        // TODO: define what render should do
        // TODO: differenziare le interfacce tra lottery owner e utente normale 

        App.contracts["Contract"].deployed().then(async(instance) =>{
            const creator = await instance.lotteryManager();
            console.log(creator.toString());
            $("#creator").html("" + creator);
        });
    },

    startLottery: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
            const duration = +document.getElementById("inputDuration").value;
            await instance.startLottery(duration, {from: App.account});
        });
    },


    buy: function() {
        // TODO: handle to confirm payment by the address that pressed the button

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
            console.log("before buy")
            // TODO: define index page to let the user put numbers, and value to pay the ticket
            await instance.buy([1,2,3,4,5,6], {from: App.account, value: 10000000000000})
            console.log("after buy")
        });
    },

    startNewRound: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
            await instance.startNewRound({from: App.account});
        });
    },

    drawNumbers: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
            await instance.drawNumbers({from: App.account});
        });
    },

    givePrizes: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
            await instance.givePrizes({from: App.account});
        });
    },

    closeLottery: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
            // TODO: define _to the address given by the manager to transfer eth
            const _to = App.account
            await instance.closeLottery(_to, {from: App.account});
        });
    }
}

/*publishEvent = function(message) {
    $("#eventMessage").html(message);
    $("#alert").fadeTo(2000, 500).slideUp(500, function(){
        $("#alert").slideUp(500);
    });
}*/

// Call init whenever the window loads
$(document).ready(function () {
    App.init();
});
