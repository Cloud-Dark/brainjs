const express = require('express');
const brain = require('brain.js');
const fs = require('fs');

const app = express();
app.use(express.json());

const net = new brain.recurrent.LSTM();


const trainingData = [
    { input: "hello", output: "greetings.hello" },
    { input: "hi", output: "greetings.hello" },
    { input: "howdy", output: "greetings.hello" },
    { input: "goodbye for now", output: "greetings.bye" },
    { input: "bye bye take care", output: "greetings.bye" },
    { input: "i must go", output: "greetings.bye" },
    { input: "who is your creator", output: "creator.identity" },
    { input: "siapa pembuat mu", output: "creator.identity" },
    { input: "calculate 10 plus 5", output: "math.add" },
    { input: "calculate 10 minus 5", output: "math.subtract" },
    { input: "calculate 10 times 5", output: "math.multiply" },
    { input: "calculate 10 divided by 5", output: "math.divide" }
];


function handleArithmetic(text) {
    const parts = text.split(" ");
    const num1 = parseFloat(parts[1]);
    const num2 = parseFloat(parts[3]);

    if (text.includes("plus")) return `The result is ${num1 + num2}`;
    if (text.includes("minus")) return `The result is ${num1 - num2}`;
    if (text.includes("times")) return `The result is ${num1 * num2}`;
    if (text.includes("divided by")) return num2 !== 0 ? `The result is ${num1 / num2}` : 'Cannot divide by zero';
    return "I couldn't understand the calculation.";
}


function getResponse(text) {
    const output = net.run(text.toLowerCase());

    switch (output) {
        case "greetings.hello":
            return "Hey there!";
        case "greetings.bye":
            return "Till next time!";
        case "creator.identity":
            return "I was created by SyahdanDev!";
        case "math.add":
        case "math.subtract":
        case "math.multiply":
        case "math.divide":
            return handleArithmetic(text);
        default:
            return "I'm not sure how to respond to that.";
    }
}



function trainModel() {
    console.log('Starting training...');

    
    net.train(trainingData, { 
        iterations: 500,       
        log: (details) => console.log(details),
        logPeriod: 10,         
        errorThresh: 0.011     
    });

    const modelJSON = net.toJSON();
    fs.writeFileSync('brain-model.json', JSON.stringify(modelJSON));
    console.log('Training completed and model saved to brain-model.json');
}




function loadModel() {
    if (fs.existsSync('brain-model.json')) {
        const modelJSON = JSON.parse(fs.readFileSync('brain-model.json'));
        net.fromJSON(modelJSON);
        console.log('Model loaded from brain-model.json');
    } else {
        console.error('No trained model found. Run with "train" to create a model first.');
        process.exit(1);
    }
}


(async () => {
    const command = process.argv[2];

    if (command === 'train') {
        trainModel();
    } else if (command === 'api') {
        loadModel();

        
        app.post('/api/message', (req, res) => {
            const { text } = req.body;
            if (!text) return res.status(400).json({ error: "Please provide a 'text' input." });

            const response = getResponse(text);
            res.json({ answer: response });
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } else if (command === 'simple_qna') {
        const input = process.argv[3];
        if (!input) {
            console.error('Please provide an input text for simple_qna');
            process.exit(1);
        }

        loadModel();
        const response = getResponse(input);
        console.log(response);
    } else {
        console.log('Usage:');
        console.log('  node index.js train                - to train and save the model');
        console.log('  node index.js api                  - to start the API server');
        console.log('  node index.js simple_qna <text>    - to process a single input');
    }
})();
