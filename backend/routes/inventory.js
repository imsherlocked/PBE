const express = require('express');
const router = express.Router();
const Item = require('../models/items');
const { dynamoDB, TABLE_NAME, ARCHIVE_TABLE_NAME } = require('../config/aws');

// // Get paginated inventory items
// router.get('/items', async (req, res) => {
//     // const { page = 1, limit = 7 } = req.query;
//     // const startIndex = (page - 1) * limit;
//     // const totalItems = await Item.countDocuments();

//     try {
//         const items = await Item.find();
//             // .limit(Number(limit))
//             // .skip(startIndex)
//             // .exec();

//         // res.json({
//         //     items,
//         //     totalPages: Math.ceil(totalItems / limit),
//         //     currentPage: Number(page),
//         // });
//         res.json(items);
//     } catch (error) {
//         res.status(500).json({ error: 'An error occurred while fetching items.' });
//     }
// });

// // Add new item
// router.post('/add', async (req, res) => {
//     try {
//         const newItem = new Item(req.body);
//         await newItem.save();

//         // Add to DynamoDB
//         const dynamoParams = {
//             TableName: TABLE_NAME,
//             Item: {
//                 id: newItem._id.toString(),
//                 name: newItem.name,
//                 quantity: newItem.quantity,
//                 price: newItem.price,
//             },
//         };
//         await dynamoDB.put(dynamoParams).promise();

//         res.json(newItem);
//     } catch (error) {
//         res.status(500).json({ error: 'An error occurred while adding the item.' });
//     }
// });

// // Update item
// router.put('/update/:id', async (req, res) => {
//     const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });

//     try {
//         const dynamoParams = {
//             TableName: TABLE_NAME,
//             Key: { id: req.params.id },
//             UpdateExpression: 'set #name = :name, #quantity = :quantity, #price = :price',
//             ExpressionAttributeNames: {
//                 '#name': 'name',
//                 '#quantity': 'quantity',
//                 '#price': 'price',
//             },
//             ExpressionAttributeValues: {
//                 ':name': updatedItem.name,
//                 ':quantity': updatedItem.quantity,
//                 ':price': updatedItem.price,
//             },
//             ReturnValues: 'UPDATED_NEW',
//         };
//         await dynamoDB.update(dynamoParams).promise();

//         res.json(updatedItem);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to update item in DynamoDB, rolled back MongoDB.' });
//     }
// });

// // Delete item
// router.delete('/delete/:id', async (req, res) => {
//     await Item.findByIdAndDelete(req.params.id);

//     try {
//         const dynamoParams = {
//             TableName: TABLE_NAME,
//             Key: { id: req.params.id },
//         };
//         await dynamoDB.delete(dynamoParams).promise();

//         res.json({ message: 'Item deleted' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to delete item from DynamoDB, rolled back MongoDB.' });
//     }
// });

// // Archive item
// router.post('/archive/:id', async (req, res) => {
//     try {
//         const itemToArchive = await Item.findById(req.params.id);
//         if (!itemToArchive) {
//             return res.status(404).json({ error: 'Item not found' });
//         }

//         // Archive item in DynamoDB
//         const archiveParams = {
//             TableName: ARCHIVE_TABLE_NAME,
//             Item: {
//                 id: itemToArchive._id.toString(),
//                 name: itemToArchive.name,
//                 quantity: itemToArchive.quantity,
//                 price: itemToArchive.price,
//                 archivedAt: new Date().toISOString(),
//             },
//         };
//         await dynamoDB.put(archiveParams).promise();

//         // Delete from active DynamoDB and MongoDB
//         const deleteParams = {
//             TableName: TABLE_NAME,
//             Key: { id: itemToArchive._id.toString() },
//         };
//         await dynamoDB.delete(deleteParams).promise();
//         await Item.findByIdAndDelete(req.params.id);

//         res.json({ message: 'Item archived successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to archive item' });
//     }
// });

router.get('/api/inventory/items', async (req, res) => {
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



router.post('/api/inventory/add', async (req, res) => {
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

router.put('/api/inventory/update/:id', async (req, res) => {
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

router.delete('/api/inventory/delete/:id', async (req, res) => {
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
router.post('/api/inventory/archive/:id', async (req, res) => {
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

module.exports = router;
