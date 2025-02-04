// Mengimpor kontrak Crowdfunding
const Crowdfunding = artifacts.require("Crowdfunding");

// Modul ekspor untuk deployment kontrak
module.exports = function (deployer) {
    // Melakukan deployment kontrak Crowdfunding ke jaringan blockchain
    deployer.deploy(Crowdfunding);
};