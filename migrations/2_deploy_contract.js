const ContractManager = artifacts.require("DappLottery");

module.exports = function (deployer) {
    deployer.deploy(ContractManager);
};
