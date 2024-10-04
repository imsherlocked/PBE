package com.assessment.demo.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.assessment.demo.Model.InventoryItem;
import com.assessment.demo.Repository.InventoryRepository;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @SuppressWarnings("unchecked")
    public List<InventoryItem> getAllItems() {
        return inventoryRepository.findAll();
    }

    @SuppressWarnings("unchecked")
    public InventoryItem addItem(InventoryItem item) {
        return (InventoryItem) inventoryRepository.save(item);
    }

    @SuppressWarnings("unchecked")
    public InventoryItem updateItem(Long id, InventoryItem updatedItem) throws Throwable {
        InventoryItem item = (InventoryItem) inventoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Item not found"));
        item.setName(updatedItem.getName());
        item.setQuantity(updatedItem.getQuantity());
        item.setPrice(updatedItem.getPrice());
        return (InventoryItem) inventoryRepository.save(item);
    }

    @SuppressWarnings("unchecked")
    public void deleteItem(Long id) {
        inventoryRepository.deleteById(id);
    }
}

