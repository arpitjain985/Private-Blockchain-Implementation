const express = require('express');
const bodyParser = require('body-parser');
const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = 4000;
const walletPath = path.join(process.cwd(), 'wallet');
const ccpPath = path.resolve(__dirname, 'connection-org1.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

const wallet = new FileSystemWallet(walletPath);

app.post('/api/createAsset', async (req, res) => {
    try {
        const { id, color, size, owner, appraisedValue } = req.body;
        
        const gateway = new Gateway();
        await gateway.connect(ccp, { 
            wallet, 
            identity: 'user1', 
            discovery: { enabled: true, asLocalhost: true } 
        });
        
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('basic');
        
        await contract.submitTransaction('CreateAsset', id, color, size.toString(), owner, appraisedValue.toString());
        await gateway.disconnect();
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/readAsset/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const gateway = new Gateway();
        await gateway.connect(ccp, { 
            wallet, 
            identity: 'user1', 
            discovery: { enabled: true, asLocalhost: true } 
        });
        
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('basic');
        
        const result = await contract.evaluateTransaction('ReadAsset', id);
        await gateway.disconnect();
        
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
