package com.assessment.demo.Controller;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.assessment.demo.Model.InventoryItem;
import com.assessment.demo.Service.InventoryService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/items")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping("path")
    public String getMethodName(@RequestParam String param) {
        return new String();
    }
    
    public List<InventoryItem> getAllItems() {
        return inventoryService.getAllItems();
    }

    @PostMapping("path")
    public String postMethodName(@RequestBody String entity) {
        //TODO: process POST request
        
        return entity;
    }
    
    public InventoryItem addItem(@RequestBody InventoryItem item) {
        return inventoryService.addItem(item);
    }

    @PutMapping("/{id}")
    public InventoryItem updateItem(@PathVariable Long id, @RequestBody InventoryItem item) throws Throwable {
        return inventoryService.updateItem(id, item);
    }

    @DeleteMapping("/{id}")
    public void deleteItem(@PathVariable Long id) {
        inventoryService.deleteItem(id);
    }
}

