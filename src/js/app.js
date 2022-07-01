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
        // TODO: usare truffle contract new() ?????
        $.getJSON("Lottery.json").done(function(c) {
            App.contracts["Contract"] = TruffleContract(c);
            App.contracts["Contract"].setProvider(App.web3Provider);

            return App.listenForEvents();
        });
    },

    // Write an event listener
    listenForEvents: function() {

        App.contracts["Contract"].deployed().then(async (instance) => {

        instance.StartLottery().on('data', function (event) {
            console.log("Event Start Lottery");
            console.log(event);
            console.log("app: "+ App.account);
            console.log("event: "+ event.returnValues.owner);
            if (App.account == event.returnValues.owner.toLowerCase()){
                $("#eventMessage").html("Lottery created!")
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
            if (App.account == event.returnValues.owner.toLowerCase()){
                $("#eventMessage").html("Success! Ticket bought.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
        });
        instance.OpenRound().on('data', function (event) {
            console.log("Event open round");
            console.log(event);
            console.log("event: "+ event.returnValues.owner);
            $("#eventEnd").html(event.returnValues.roundEnds);
            $("#eventMessage").html("The Lottery round has started.");
            $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                $("#alert").slideUp(500);
            });
        });
        instance.CloseRound().on('data', function (event) {
            console.log("Event close round");
            console.log(event);
            console.log(event.returnValues.winningNumbers);
            $("#eventWin").html("The drawn winning numbers are: "+event.returnValues.winningNumbers);
            $("#eventMessage").html("Round Closed!");
            $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                $("#alert").slideUp(500);
            });
        });
        instance.NFTPrizeWon().on('data', function (event) {
            console.log("Event prize won");
            console.log(event);
            const owner = event.returnValues.owner.toLowerCase()
            if (App.account == owner){
                $("#eventNFTwinner").html(owner);
                $("#eventNFTtoken").html(event.returnValues.NFTtoken);
                $("#eventNFTclass").html(+"You won a NFT of class "+event.returnValues.nftClass);
                $("#eventMessage").html("You won!");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500); 
                });
            }
        });
        instance.CloseContract().on('data', function (event) {
            console.log("Contract closed");
            console.log(event);
            $("#eventMessage").html("The Lottery is now closed.");
            $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                $("#alert").slideUp(500);
            });
            self.location = "index.html"
        });
    });

        return App.render();
    },

    render: function() {

        App.contracts["Contract"].deployed().then(async(instance) =>{
            const creator = await instance.lotteryManager();
            const lottery = await instance.lotteryActive();
            const blockClosed = await instance.numberClosedRound();
            const K = await instance.K();
            var numbers = new Array(6);
            
            for (let i = 0; i < 6; i++) {
                let wNumber = await instance.winningNumbers(i);
                numbers[i] = wNumber;
            }
            console.log(numbers)

            const latest = await web3.eth.getBlockNumber()
            const prizes = parseInt(blockClosed) + parseInt(K) + 1; 

            var status = "Unactive"
            if (latest < blockClosed){
                status = "Active"
            }

            $("#statusLottery").html("Lottery: " + lottery)
            $("#statusRound").html("Round: "+ status)
            $("#closingBlock").html("Closing block: " + blockClosed)
            $("#statusBlock").html("Current block: " + latest)
            $("#statusPrizes").html("Give prizes from block: " + prizes)
            if (numbers[0] != 0 && latest > prizes){
                $("#eventWin").html("The drawn winning numbers are: "+numbers);
            }

            console.log("creator:" + creator.toString());
            $("#creator").html("" + creator);
        });
    },

    renderManager: function() {

        App.contracts["Contract"].deployed().then(async(instance) =>{
            const manager = await instance.lotteryManager();
            console.log(manager)
            if (manager == null) {
                self.location = "indexStartLottery.html"
            } else if (App.account == manager.toLowerCase()) {
                self.location = "indexManager.html"
            } else {
                $("#eventMessage").html("Error: You're not the manager!");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
        });
    },

    renderUser: function() {
        self.location = "indexUser.html"
    },

    startLottery: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
                const duration = +document.getElementById("inputDuration").value;
                // TODO: inserire controllo value
                try {
                    await instance.startLottery(duration, {from: App.account});
                } catch (e) {
                    console.log(e);
                    $("#eventMessage").html(e.reason);
                    $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                        $("#alert").slideUp(500);
                    });
                }
        });
    },

    buy: function() {
        // TODO: handle to confirm payment by the address that pressed the button

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
            console.log("before buy")
            var input = document.getElementsByName('inputNumbers[]');
            var numbers = new Array(6);

            for (var i = 0; i < input.length; i++) {
                numbers[i] = input[i].value;
            }
            console.log(numbers)
            try {
                await instance.buy(numbers, {from: App.account, value: web3.utils.toWei('100', 'gwei')})
            } catch (e) {
                console.log(e);
                var message = "Error: No Lottery round active.";
                if (e.reason == "invalid BigNumber string"){
                    message = "Error: Invalid numbers used. Please, provide 6 different numbers inside the ranges."
                }
                $("#eventMessage").html(message);
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                return;
                });
            }
            console.log("after buy")
        });
    },

    startNewRound: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try {
                await instance.startNewRound({from: App.account});
            } catch (e) {
                console.log(e);
                $("#eventMessage").html(e);
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
        });
    },

    drawNumbers: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try {
                await instance.drawNumbers({from: App.account});
            } catch (e) {
                console.log(e);
                $("#eventMessage").html(e);
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
        });
    },

    givePrizes: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try {
                await instance.givePrizes({from: App.account});
            } catch (e) {
                console.log(e);
                $("#eventMessage").html(e);
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
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
