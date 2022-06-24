const { assert } = require("chai");

describe("Lottery Tests", function(){

    it("Lottery Round", async function () {
        this.timeout(100000)
        const artifactsPath = 'contracts/artifacts/MockLottery.json' // Change this for different path
        const metadata = JSON.parse(await remix.call('fileManager', 'getFile', artifactsPath))
        const accounts = await web3.eth.getAccounts()
        let contract = new web3.eth.Contract(metadata.abi)
        contract = contract.deploy({
            data: metadata.data.bytecode.object,
            arguments: [5] // M = 5
        })


        // test to deploy the contract
        let testContract = await contract.send({
          from: accounts[0],
          gas: 15000000000,
          gasPrice: '300000000'
      })
        let lotteryActive =  await testContract.methods.lotteryActive().call()
        assert.equal(lotteryActive, true, "The lottery should be active")


        // test to buy a ticket
        // class 1 winner
        await testContract.methods.buy([1,2,3,4,5,6]).send({
            from: accounts[1],
            gas: 15000000000,
            gasPrice: '30000000000',
            value: web3.utils.toWei("100", "gwei")
        })
        console.log("Buy ticket 1");

        // class 5 winner
        await testContract.methods.buy([1,2,9,10,11,6]).send({
            from: accounts[1],
            gas: 15000000000,
            gasPrice: '30000000000',
            value: web3.utils.toWei("100", "gwei")
        })
        console.log("Buy ticket 2");
        
        // class 6 winner
        await testContract.methods.buy([1,14,15,16,2,18]).send({
            from: accounts[2],
            gas: 15000000000,
            gasPrice: '30000000000',
            value: web3.utils.toWei("100", "gwei")
        })
        console.log("Buy ticket 3");

        // no winner
        await testContract.methods.buy([19,20,21,22,23,24]).send({
            from: accounts[2],
            gas: 15000000000,
            gasPrice: '30000000000',
            value: web3.utils.toWei("100", "gwei")
        })
        console.log("Buy ticket 4");

        // class 7 winner
        await testContract.methods.buy([25,26,27,28,5,10]).send({
            from: accounts[3],
            gas: 15000000000,
            gasPrice: '300000000',
            value: web3.utils.toWei("100", "gwei")
        })
        console.log("Buy ticket 5");


        // check if the address used are actually players
        for (let i = 0; i < 3; i++) {
            let players = await testContract.methods.players(i).call()
            assert.equal(players, accounts[i+1], "Not the correct address")
        }
        console.log("Players OK")


        // simulate the K blocks (transactions) to let the manager draw the numbers
        let kValue = await testContract.methods.K().call()
        for (let i = 0; i < kValue; i++) {
            try {
                await testContract.methods.buy([1,2,3,4,5,6]).send({
                    from: accounts[5],
                    gas: 150000000,
                    gasPrice: '30000000000',
                    value: web3.utils.toWei("100", "gwei")
                });
            } catch (e) {};
        }   

        let currentBlock = await web3.eth.getBlockNumber()
        let closingNumber = await testContract.methods.numberClosedRound().call()
        let expectedBlock = (parseInt(closingNumber) + parseInt(kValue))
        assert(currentBlock >= expectedBlock, "You need to wait to extract numbers")


        // test the drawNumbers function
        // at the beginning should be all 0s
        for (let i = 0; i < 6; i++) {
            let wNumber = await testContract.methods.winningNumbers(i).call()
            assert.equal(Number(wNumber), 0, "Not an empty position for winningNumbers")
        }
        await testContract.methods.drawNumbers().send({
            from: accounts[0],
            gas: 15000000000,
            gasPrice: '30000000000'
        })
        // the winning numbers are drawn
        for (let i = 0; i < 6; i++) {
            let wNumber = await testContract.methods.winningNumbers(i).call()
            assert.notEqual(Number(wNumber), 0, "winningNumbers should have numbers higher than 0")
            console.log("Winning Numbers:" + wNumber)
        }
        testContract.getPastEvents("RedrawNumber", { fromBlock: 0 }).then((events) => console.log(events));
        console.log("drawNumbers OK");


        // update the winning numbers to make a deterministic test
        await testContract.methods.mockDrawNumbers([1,2,3,4,5,6]).send({
            from: accounts[0],
            gas: 15000000000,
            gasPrice: '30000000000'
        })
        for (let i = 0; i < 6; i++) {
            let wNumber = await testContract.methods.winningNumbers(i).call()
            assert.equal(Number(wNumber), i+1, "Not an empty position for winningNumbers")
            console.log("Mock Winning Numbers:" + wNumber)
        }


        // test givePrizes
        await testContract.methods.givePrizes().send({
            from: accounts[0],
            gas: 15000000000,
            gasPrice: '30000000000'
        })
        testContract.getPastEvents("NFTPrizeWon", { fromBlock: 0 }).then((events) => console.log(events));
        // account 1 won two prizes of class 1 and 5
        let prize = await testContract.methods.NFTList(accounts[1],0).call()
        assert.equal(prize, 1, "Prize won by address 1 is different")
        prize = await testContract.methods.NFTList(accounts[1],1).call()
        assert.equal(prize, 5, "Prize won by address 1 is different")

        //acount 2 won one prize of class 6 
        prize = await testContract.methods.NFTList(accounts[2],0).call()
        assert.equal(prize, 6, "Prize won by address 2 is different")

        //acount 3 won one prize of class 7
        prize = await testContract.methods.NFTList(accounts[3],0).call()
        assert.equal(prize, 7, "Prize won by address 3 is different")
        console.log("givePrizes OK");


        // close the lottery
        await testContract.methods.closeLottery(accounts[0]).send({
            from: accounts[0],
            gas: 15000000000,
            gasPrice: '30000000000'
        })

        try {
            lotteryActive = await testContract.methods.lotteryActive().call()
        } catch (e) {
            console.log("The lottery is closed")
        }
        console.log("CloseLottery OK");

    });
});