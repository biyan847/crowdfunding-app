let web3;
let contract;
const contractAddress = "0x73C5710f2C1758ab0a5F07040331BBb1906C429c";


// Fungsi untuk menghubungkan dompet pengguna ke DApp
async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        const shortAddress = accounts[0].slice(0, 6) + "..." + accounts[0].slice(-4);
        document.getElementById("wallet-address").innerText = "Wallet: " + shortAddress;

        // ABI kontrak untuk berinteraksi dengan fungsi-fungsinya
        const contractABI = [
            {
                "inputs": [
                    { "internalType": "string", "name": "_title", "type": "string" },
                    { "internalType": "string", "name": "_description", "type": "string" },
                    { "internalType": "uint256", "name": "_goal", "type": "uint256" },
                    { "internalType": "uint256", "name": "_deadline", "type": "uint256" }
                ],
                "name": "createCampaign",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
                "name": "pledge",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            }
        ];

        contract = new web3.eth.Contract(contractABI, contractAddress);
        loadCampaigns();
    } else {
        alert("Metamask tidak ditemukan");
    }
}

// Fungsi untuk membuat campaign baru
async function createCampaign() {
    const accounts = await web3.eth.getAccounts();
    if (!accounts.length) {
        alert("Wallet tidak terhubung!");
        return;
    }

    // Mengambil data dari form
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const goal = web3.utils.toWei(document.getElementById("goal").value, "ether");
    const deadline = Math.floor(new Date(document.getElementById("deadline").value).getTime() / 1000);

    console.log("Data yang dikirim:", { title, description, goal, deadline });

    try {
        // Menghitung estimasi gas untuk transaksi
        const gasEstimate = await contract.methods.createCampaign(title, description, goal, deadline)
            .estimateGas({ from: accounts[0] });

        const gasPrice = await web3.eth.getGasPrice();

        // Mengirim transaksi ke blockchain
        await contract.methods.createCampaign(title, description, goal, deadline)
            .send({
                from: accounts[0],
                gas: Math.floor(Number(gasEstimate) * 1.2),
                gasPrice: gasPrice.toString()
            });

        alert("Campaign berhasil dibuat!");

        // Menambahkan campaign ke daftar UI
        addCampaignCard(title, description, web3.utils.fromWei(goal, "ether"), deadline);

        // Mengosongkan input form setelah berhasil
        document.getElementById("title").value = "";
        document.getElementById("description").value = "";
        document.getElementById("goal").value = "";
        document.getElementById("deadline").value = "";
        
    } catch (error) {
        console.error("Error saat membuat campaign:", error);
        alert("Gagal membuat campaign. Cek console untuk detail.");
    }
}

// Fungsi untuk menambahkan kartu campaign ke UI
function addCampaignCard(title, description, goal, deadline) {
    const campaignList = document.getElementById("campaign-list");
    const card = document.createElement("div");
    card.className = "campaign-card";
    card.innerHTML = `
        <h3>${title}</h3>
        <p>${description}</p>
        <p>Target: ${goal} ETH</p>
        <p>Deadline: ${new Date(deadline).toLocaleString()}</p>
    `;
    campaignList.appendChild(card);
}

// Fungsi untuk memuat daftar campaign dari blockchain
async function loadCampaigns() {
    if (!contract) return;

    const campaignList = document.getElementById("campaign-list");
    campaignList.innerHTML = "";

    try {
        let i = 0;
        while (true) {
            try {
                // Mengambil data campaign dari kontrak
                const campaign = await contract.methods.campaigns(i).call();
                if (!campaign.title) break;
                addCampaignCard(campaign.title, campaign.description, web3.utils.fromWei(campaign.goal, "ether"), campaign.deadline);
            } catch (error) { break; }
            i++;
        }
    } catch (error) {
        console.error("Error loading campaigns:", error);
    }
}
