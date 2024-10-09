const express = require('express');
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const cors = require('cors');
const connectDB = require('./config/db'); // Import DB connection
// const { dynamoDB, TABLE_NAME, ARCHIVE_TABLE_NAME } = require('./config/aws');
const Item =  require('./models/items');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));
connectDB();

// Inventory Item Schema
// const itemSchema = new mongoose.Schema({
//     name: String,
//     quantity: Number,
//     price: Number,
// });

// const Item = mongoose.model('Item', itemSchema);

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'inventorydbsecondary'; // DynamoDB Table Name

app.get('/api/inventory/items', async (req, res) => {
    console.log("Inside get")
    // const { page = 1, limit = 7 } = req.query; // Default to page 1 and limit 7 items per page
    // const startIndex = (page - 1) * limit;
    // const totalItems = await Item.countDocuments(); // Get the total count of items
    try {
        console.log("Inside get try")
        const items = await Item.find()
        // .limit(limit * 1)
        // .skip(startIndex)
        // .exec();

        res.json(items);
        // res.json({
        //     items,
        //     totalPages: Math.ceil(totalItems / limit),
        //     currentPage: Number(page),
        // });        
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching items.' });
    }
});

// Update the GET route to support pagination
// app.get('/api/inventory/items', async (req, res) => {
//     try {
//         let { page, limit } = req.query;

//         // Convert page and limit to integers
//         page = parseInt(page) || 1;
//         limit = parseInt(limit) || 7;

//         const items = await Item.find()
//             .limit(limit)
//             .skip((page - 1) * limit)
//             .exec();

//         const count = await Item.countDocuments(); // Get the total count of items

//         res.json({
//             items,
//             totalPages: Math.ceil(count / limit),
//             currentPage: page,
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'An error occurred while fetching items.' });
//     }
// });



app.post('/api/inventory/add', async (req, res) => {
    console.log("Inside add")
    try {
        console.log("Inside add try")
        const newItem = new Item(req.body);
        await newItem.save();

        console.log("Inside add try after")

        try {
            const dynamoParams = {
                TableName: 'inventorydbsecondary',
                Item: {
                    id: newItem._id.toString(),
                    name: newItem.name,
                    quantity: newItem.quantity,
                    price: newItem.price
                }
            };
            await dynamoDB.put(dynamoParams).promise();
        } catch (dynamoError) {
            console.error('Error adding item to DynamoDB:', dynamoError);
            await Item.findByIdAndDelete(newItem._id);
            alert("Database issue please re-enter your entry");
            // Optionally add logic here to retry or log this somewhere to handle it later.
        }

        res.json(newItem);
    } catch (error) {
        console.error('Error adding item to MongoDB:', error);
        res.status(500).json({ error: 'An error occurred while adding the item.' });
    }
});

app.put('/api/inventory/update/:id', async (req, res) => {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });

    try {
        const dynamoParams = {
            TableName: 'inventorydbsecondary',
            Key: {
                id: req.params.id,
            },
            UpdateExpression: 'set #name = :name, #quantity = :quantity, #price = :price',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#quantity': 'quantity',
                '#price': 'price',
            },
            ExpressionAttributeValues: {
                ':name': updatedItem.name,
                ':quantity': updatedItem.quantity,
                ':price': updatedItem.price,
            },
            ReturnValues: 'UPDATED_NEW',
        };
        await dynamoDB.update(dynamoParams).promise();
    } catch (dynamoError) {
        console.error('Error updating item in DynamoDB:', dynamoError);
        await Item.findByIdAndUpdate(req.params.id, originalItem, { new: true });
        return res.status(500).json({ error: 'Failed to update item in DynamoDB, rolled back MongoDB.' });
    }

    res.json(updatedItem);
});

app.delete('/api/inventory/delete/:id', async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);

    try {
        const dynamoParams = {
            TableName: 'inventorydbsecondary',
            Key: {
                id: req.params.id,
            },
        };
        await dynamoDB.delete(dynamoParams).promise();
    } catch (dynamoError) {
        console.error('Error deleting item from DynamoDB:', dynamoError);
        await new Item(itemToDelete).save();
        return res.status(500).json({ error: 'Failed to delete item from DynamoDB, rolled back MongoDB.' });
    }

    res.json({ message: 'Item deleted' });
});

// Archive an item by moving it to the archived DynamoDB table and deleting from primary DB
app.post('/api/inventory/archive/:id', async (req, res) => {
    try {
        // Find the item in MongoDB
        const itemToArchive = await Item.findById(req.params.id);
        if (!itemToArchive) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Copy the item to DynamoDB archive table
        const archiveParams = {
            TableName: 'archivedb', // DynamoDB Archive Table Name
            Item: {
                id: itemToArchive._id.toString(),
                name: itemToArchive.name,
                quantity: itemToArchive.quantity,
                price: itemToArchive.price,
                archivedAt: new Date().toISOString(), // Optional: Store when the item was archived
            },
        };

        await dynamoDB.put(archiveParams).promise(); // Insert into archive table

        // Delete the item from the active DynamoDB table
        const deleteParams = {
            TableName: 'inventorydbsecondary',
            Key: {
                id: itemToArchive._id.toString(),
            },
        };

        await dynamoDB.delete(deleteParams).promise(); // Remove from active table

        // Optionally delete the item from MongoDB if no longer needed
        await Item.findByIdAndDelete(req.params.id);

        res.json({ message: 'Item archived successfully' });
    } catch (error) {
        console.error('Error archiving item:', error);
        res.status(500).json({ error: 'Failed to archive item' });
    }
});
// app.get('/items', async (req, res) => {
//     const items = await Item.find();
//     res.json(items);
// });

// app.post('/items', async (req, res) => {
//     const newItem = new Item(req.body);
//     await newItem.save();
//     res.json(newItem);
// });

// app.put('/items/:id', async (req, res) => {
//     const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(updatedItem);
// });

// app.delete('/items/:id', async (req, res) => {
//     await Item.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Item deleted' });
// });

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} hello`);
});
