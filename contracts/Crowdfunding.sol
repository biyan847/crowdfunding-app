// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
    struct Campaign {
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        address owner;
        uint256 amountRaised;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount;

    event CampaignCreated(uint256 indexed id, address indexed owner, uint256 goal, uint256 deadline);
    event Pledged(uint256 indexed campaignId, address indexed backer, uint256 amount);
    event FundsClaimed(uint256 indexed campaignId, address indexed owner, uint256 amount);

    modifier onlyOwner(uint256 _id) {
        require(msg.sender == campaigns[_id].owner, "Hanya pemilik campaign yang dapat melakukan ini");
        _;
    }

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _deadline
    ) public {
        require(bytes(_title).length > 0, "Judul harus diisi");
        require(_goal > 0, "Target dana harus lebih besar dari 0");
        require(_deadline > block.timestamp, "Deadline harus di masa depan");

        campaigns[campaignCount] = Campaign({
            title: _title,
            description: _description,
            goal: _goal,
            deadline: _deadline,
            owner: msg.sender,
            amountRaised: 0
        });

        emit CampaignCreated(campaignCount, msg.sender, _goal, _deadline);
        campaignCount++;
    }

    function pledge(uint256 _id) public payable {
        require(msg.value > 0, "Donasi harus lebih dari 0");
        require(_id < campaignCount, "Campaign tidak ditemukan");
        require(block.timestamp < campaigns[_id].deadline, "Campaign sudah berakhir");

        campaigns[_id].amountRaised += msg.value;

        emit Pledged(_id, msg.sender, msg.value);
    }

    function claimFunds(uint256 _id) public onlyOwner(_id) {
        Campaign storage campaign = campaigns[_id];

        require(block.timestamp > campaign.deadline, "Campaign belum berakhir");
        require(campaign.amountRaised >= campaign.goal, "Dana belum mencapai target");

        uint256 amount = campaign.amountRaised;
        campaign.amountRaised = 0; // Reset jumlah agar tidak bisa ditarik dua kali

        payable(campaign.owner).transfer(amount);

        emit FundsClaimed(_id, campaign.owner, amount);
    }

    // Fallback untuk menerima dana langsung
    receive() external payable {}
}
