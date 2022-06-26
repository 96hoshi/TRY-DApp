// Import the contracts to migrate from build
const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
// Deploy the Migrations contract, i.e. an instance of Migration on the target network
// This command executes the constructor. If Migration would have had parameters
// in its constructor, they should have been as following arguments of deploy()
  deployer.deploy(Migrations);
};
