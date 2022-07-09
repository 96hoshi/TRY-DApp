App = {

    contracts: {},
    web3Provider: null,             // Web3 provider
    url: 'http://localhost:8545',   // Url for web3
    account: '0x0',                 // current ethereum account
    lottery_addr: '0x0',

    init: function() {
        $("#alert").hide();
        return App.initWeb3();
    },

    /* initialize Web3 */
    initWeb3: function() {
        console.log("Entered")
        
        if(typeof web3 != 'undefined') {
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

        // Get current account
        web3.eth.getCoinbase(function(err, account) {
            if(err == null) {
                App.account = account;
                $("#accountId").html("Your address: " + account);
            }
        });

        // Load content's abstractions
        $.getJSON("DappLottery.json").done(function(c) {
            App.contracts["ContractManager"] = TruffleContract(c);
            App.contracts["ContractManager"].setProvider(App.web3Provider);
            return App.initLotteryContract();
        });
    },

    initLotteryContract: function() {

        App.contracts["ContractManager"].deployed().then(async (instance) => {
            App.lottery_addr = await instance.lottery_address();
            console.log(App.lottery_addr)

            if (App.lottery_addr != '0x0000000000000000000000000000000000000000'){
                $.getJSON("Lottery.json").done(function(c) {
                    App.contracts["Contract"] = TruffleContract(c);
                    App.contracts["Contract"].setProvider(App.web3Provider);
                    return App.listenForEvents();
                });
            }
            return App.renderIndex();
        });
    },

    // Write the events listener
    listenForEvents: function() {

        App.contracts["Contract"].at(App.lottery_addr).then(async (instance) => {

        // the lottery operator open the lottery contract
        instance.StartLottery({
            }).on('data', function (event) {
            console.log("Event Start Lottery");
            console.log(event);
            console.log("app: "+ App.account);
            console.log("event: "+ event.returnValues.owner);
            $("#eventMessage").html("Lottery created!")
            $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                $("#alert").slideUp(500);
            });

        });
        // a user buy a ticket
        instance.BuyTicket().on('data', function (event) {
            console.log("Event buy ticket");
            console.log(event);
            if (App.account == event.returnValues.owner.toLowerCase()){
                $("#eventMessage").html("Success! Ticket bought.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
        });
        // the lottery operator open a new round
        instance.OpenRound().on('data', function (event) {
            console.log("Event open round");
            console.log(event);
            $("#eventMessage").html("The Lottery round has started.");
            $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                $("#alert").slideUp(500);
            });
        });
        // the round of the lottery is closed and the winning numbers are shown
        instance.CloseRound().on('data', function (event) {
            console.log("Event close round");
            console.log(event);
            console.log("Winning numbers: " + event.returnValues.winningNumbers);
            $("#eventMessage").html("Round Closed!");
            $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                $("#alert").slideUp(500);
            });
        });
        // a user win an nft prize
        instance.NFTPrizeWon().on('data', function (event) {
            console.log("Event prize won");
            console.log(event);
            console.log("token: "+ event.returnValues.NFTtoken);
            if (App.account == event.returnValues.owner.toLowerCase()){
                $("#eventMessage").html("You won!");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500); 
                });
            }
        });
        // a user who participated in the lottery did not win
        instance.NotWinner().on('data', function (event) {
            console.log("Event lost round");
            console.log(event);
            if (App.account == event.returnValues.owner.toLowerCase()){
                $("#eventMessage").html("Unlucky! You didn't win any prize this time.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
        });
        // the lottery is closed
        instance.CloseContract().on('data', function (event) {
            console.log("Contract closed");
            console.log(event);
            $("#eventMessage").html("The Lottery is now closed.");
            $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                $("#alert").slideUp(500);
            });
        });
    });

        return App.render();
    },

    //function that shows on screen info about lottery status
    render: function() {

        App.contracts["Contract"].at(App.lottery_addr).then(async(instance) =>{
            // TODO: check for correct location if the lottery is not active
            const creator = await instance.lotteryManager();
            // check for correct location for users
            if (App.account != creator.toLowerCase() && self.location == "http://localhost:3000/indexManager.html"){
                self.location = "index.html";
                return;
            }

            const tickets = await instance.tickets();
            const closedBlock = await instance.numberClosedRound();
            const latestBlock = await web3.eth.getBlockNumber();
            const K = await instance.K();
            const prizesBlock = parseInt(closedBlock) + parseInt(K);
            const userPrizes = await instance.getNFTListClass({from: App.account});
            console.log("prizes: "+ userPrizes);

            var statusRound = "Inactive"
            if (latestBlock < closedBlock) {
                statusRound = "Active"
            }

            // print info about the lottery
            $("#statusRound").html("Round: "+ statusRound)
            $("#statusBlock").html("Current block: " + latestBlock)
            $("#closingBlock").html("Closing round block: " + closedBlock)
            $("#statusPrizes").html("Draw numbers from block: " + prizesBlock)
            $("#ticketsSold").html("Tickets sold this round: " + tickets)
            $("#creator").html("" + creator);
            $("#userPrizes").html("Your prizes: " + userPrizes)

            // retrive last winning numbers
            if (latestBlock >= closedBlock && statusRound == "Inactive") {
                instance.getPastEvents('CloseRound', {
                    fromBlock: parseInt(closedBlock),
                    toBlock: 'latest'
                }, function(error, events){ console.log(events); })
                .then(function(events){
                    if (events.length != 0){
                        $("#eventWin").html("The winning numbers are: "+ events[0].returnValues.winningNumbers+".");
                    }
                });
            }
            // check if a player has won
            if (latestBlock >= prizesBlock){
                instance.getPastEvents('NFTPrizeWon', {
                    fromBlock: parseInt(closedBlock),
                    toBlock: 'latest'
                }, function(error, events){ console.log(events); })
                .then(function(events){
                    if (events.length != 0){
                        var classes = ""
                        for (let i = 0; i < events.length; i++){
                            if (App.account == events[i].returnValues.owner.toLowerCase()){
                                classes = classes +" " + String(events[i].returnValues.nftClass);
                            }
                        }
                        console.log("Classes: " + classes)
                        if (latestBlock >= prizesBlock){
                            $("#eventNFTclass").html("Congrats! You won the NFT of class "+classes+".");
                        }
                    }
                });
                // or not
                instance.getPastEvents('NotWinner', {
                    fromBlock: parseInt(closedBlock),
                    toBlock: 'latest'
                }, function(error, events){ console.log(events); })
                .then(function(events){
                    if (events.length != 0){
                        for (let i = 1; i < events.length; i++){
                            if (App.account == events[i].returnValues.owner.toLowerCase()){
                                $("#eventNFTclass").html("Unlucky! You didn't win any prize.");
                            }
                        }
                    }
                });
            }
        });
    },

    renderIndex: function() {
        App.contracts["ContractManager"].deployed().then(async(instance) =>{
            const active = await instance.lottery_active();
            var status = "not active"

            if (active) {
                status = "active"
            } 
            $("#statusLottery").html("The lottery is "+status+"!");
        });
    },

    renderManager: function() {

        App.contracts["ContractManager"].deployed().then(async(instance) =>{
            const manager = await instance.lottery_manager();
            const active = await instance.lottery_active();
            console.log(manager)
            console.log(active)

            if (!active) {
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

        App.contracts["ContractManager"].deployed().then(async(instance) =>{
            const active = await instance.lottery_active();
            if (!active){
                $("#eventMessage").html("Error: No lottery active.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
            else {
                self.location = "indexUser.html"
            }
        });
    },

    createLottery: function() {

        console.log(App.contracts["ContractManager"])
        App.contracts["ContractManager"].deployed().then(async(instance) =>{
            const active = await instance.lottery_active();
            if (active){
                $("#eventMessage").html("Error: Lottery already active");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
                return;
            }
            const duration = +document.getElementById("inputDuration").value;
            try {
                await instance.createLottery(duration, {from: App.account});
            } catch (e) {
                console.log(e);
                $("#eventMessage").html("Error: Invalid number.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
                return;
            }
            self.location = "indexManager.html"
        });
    },

    buy: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].at(App.lottery_addr).then(async(instance) =>{
            var input = document.getElementsByName('inputNumbers[]');
            var numbers = new Array(6);
            // retrieve values input
            for (var i = 0; i < input.length; i++) {
                numbers[i] = input[i].value;
                input[i].value = "";
            }
            console.log(numbers)
            // check value ranges
            for (var i = 0; i < numbers.length-1; i++) {
                if (numbers[i] < 1 || numbers[i] > 69){
                    $("#eventMessage").html("Error: Invalid numbers used. Please, provide 6 different numbers inside the ranges.");
                    $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                        $("#alert").slideUp(500);
                    });
                    return;
                }
            }
            if (numbers[5] < 1 || numbers[5] > 26){
                $("#eventMessage").html("Error: Invalid numbers used. Please, provide 6 different numbers inside the ranges.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
                return;
            }

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
                });
            }
        });
    },

    showPrize: function(){

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].at(App.lottery_addr).then(async(instance) =>{
            try {
                const l = await instance.getNFTList({from: App.account});
                const c = await instance.getNFTListClass({from: App.account});
                console.log("list: "+l)
                console.log("classes: " +c)
                $("#prize").empty()
                for (i = 0; i < l.length; i++) {
                    const imgURI = await instance.getURI(l[i]);
                    console.log("URI:" +imgURI)
                    const classNFT = c[i].toString()
                    $("#prize").append(`<figure class="figure">
                          <figcaption class="figure-caption">Prize of class `+ classNFT +`</figcaption>
                          <img src="`+ imgURI + `"class="img-thumbnail">
                        </figure>`)
                }
                $("#prize").append('<button class="btn btn-link" onclick="clearPrize()">Hide</button>')
            } catch (e) {
                console.log(e)
                $("#eventMessage").html("Error: Some error occurred.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }

        });
    },

    startNewRound: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].at(App.lottery_addr).then(async(instance) =>{
            const manager = await instance.lotteryManager();
            if (App.account != manager.toLowerCase()) {
                self.location = "index.html"
            }

            try {
                await instance.startNewRound({from: App.account});
            } catch (e) {
                console.log(e);
                const closedBlock = await instance.numberClosedRound();
                const latest = await web3.eth.getBlockNumber()
                var message = "Error: You need to give prizes before starting a new round!";
                if (latest < closedBlock){
                    message  = "Error: A lottery round is still active. You can not start a new round now."
                }
                $("#eventMessage").html(message);
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
        });
    },

    drawNumbers: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].at(App.lottery_addr).then(async(instance) =>{
            const manager = await instance.lotteryManager();
            if (App.account != manager.toLowerCase()) {
                self.location = "index.html"
            }

            const draw = await instance.numbersDraw();
            if (draw){
                $("#eventMessage").html("Error: You have already draw the numbers.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
                return;
            }

            try {
                await instance.drawNumbers({from: App.account});
            } catch (e) {
                console.log(e);
                $("#eventMessage").html("Error: You need to wait to extract numbers.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
        });
    },

    givePrizes: function() {

        console.log(App.contracts["Contract"])
        App.contracts["Contract"].at(App.lottery_addr).then(async(instance) =>{
            const manager = await instance.lotteryManager();
            if (App.account != manager.toLowerCase()) {
                self.location = "index.html"
            }

            const given = await instance.prizeGiven();
            if (given){
                $("#eventMessage").html("Error: You have already given the prizes.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
                return;
            }

            try {
                await instance.givePrizes({from: App.account});
            } catch (e) {
                console.log(e);
                $("#eventMessage").html("Error: the round is still active.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                });
            }
        });
    },

    closeLottery: function() {

        App.contracts["Contract"].at(App.lottery_addr).then(async(instance) =>{
            const manager = await instance.lotteryManager();
            if (App.account != manager.toLowerCase()) {
                self.location = "index.html"
            }

            // TODO: define _to the address given by the manager to transfer eth
            const _to = App.account
            try {
                await instance.closeLottery(_to, {from: App.account});
            } catch (e) {
                console.log(e);
                $("#eventMessage").html("Error: function reverted.");
                $("#alert").fadeTo(2000, 500).slideUp(500, function(){
                    $("#alert").slideUp(500);
                return
                });
            }
            return App.closeLotteryContract();
        });
    },

    closeLotteryContract: function() {

        App.contracts["ContractManager"].deployed().then(async(instance) => {
            await instance.closeLottery({from: App.account});
            App.lottery_addr = await instance.lottery_address();
            console.log(App.lottery_addr)
            console.log("lottery closed")
            self.location = "index.html"
        });

    }
}

// Call init whenever the window loads
$(document).ready(function () {
    App.init();
});
