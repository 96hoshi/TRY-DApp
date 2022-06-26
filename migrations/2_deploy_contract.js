const Contract = artifacts.require("Lottery");

module.exports = function (deployer) {
    deployer.deploy(Contract, 5);
};
