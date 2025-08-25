// PortTrack MongoDB Initialization Script

// Switch to porttrack_nosql database
db = db.getSiblingDB('porttrack_nosql');

// Create collections with validation
db.createCollection("ships", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["imo_number", "name", "ship_type"],
         properties: {
            imo_number: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            name: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            ship_type: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            status: {
               bsonType: "string",
               enum: ["active", "inactive", "maintenance", "retired"]
            }
         }
      }
   }
});

db.createCollection("cargo", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["cargo_type", "ship_id"],
         properties: {
            cargo_type: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            ship_id: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            hazardous: {
               bsonType: "bool"
            }
         }
      }
   }
});

db.createCollection("routes", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["origin_port", "destination_port", "ship_id"],
         properties: {
            origin_port: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            destination_port: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            ship_id: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            status: {
               bsonType: "string",
               enum: ["scheduled", "in_progress", "completed", "cancelled"]
            }
         }
      }
   }
});

db.createCollection("port_operations", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["operation_type", "ship_id"],
         properties: {
            operation_type: {
               bsonType: "string",
               enum: ["loading", "unloading", "refueling", "maintenance", "crew_change"]
            },
            ship_id: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            status: {
               bsonType: "string",
               enum: ["scheduled", "in_progress", "completed", "cancelled"]
            }
         }
      }
   }
});

db.createCollection("users", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["auth0_id", "email"],
         properties: {
            auth0_id: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            email: {
               bsonType: "string",
               pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
            },
            role: {
               bsonType: "string",
               enum: ["user", "operator", "supervisor", "admin"]
            }
         }
      }
   }
});

db.createCollection("audit_logs", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["action", "collection", "timestamp"],
         properties: {
            action: {
               bsonType: "string",
               enum: ["create", "read", "update", "delete"]
            },
            collection: {
               bsonType: "string"
            },
            timestamp: {
               bsonType: "date"
            }
         }
      }
   }
});

// Create indexes for better performance
db.ships.createIndex({ "imo_number": 1 }, { unique: true });
db.ships.createIndex({ "status": 1 });
db.ships.createIndex({ "ship_type": 1 });

db.cargo.createIndex({ "ship_id": 1 });
db.cargo.createIndex({ "cargo_type": 1 });
db.cargo.createIndex({ "hazardous": 1 });

db.routes.createIndex({ "ship_id": 1 });
db.routes.createIndex({ "status": 1 });
db.routes.createIndex({ "origin_port": 1, "destination_port": 1 });

db.port_operations.createIndex({ "ship_id": 1 });
db.port_operations.createIndex({ "operation_type": 1 });
db.port_operations.createIndex({ "status": 1 });
db.port_operations.createIndex({ "start_time": 1 });

db.users.createIndex({ "auth0_id": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.audit_logs.createIndex({ "timestamp": 1 });
db.audit_logs.createIndex({ "collection": 1, "action": 1 });

// Insert sample data
db.ships.insertMany([
    {
        imo_number: "IMO1234567",
        name: "PortTrack Explorer",
        ship_type: "Container Ship",
        length_m: 300.5,
        width_m: 42.8,
        draft_m: 15.2,
        gross_tonnage: 45000,
        flag: "Panama",
        home_port: "Rotterdam",
        owner: "PortTrack Shipping Co.",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        imo_number: "IMO2345678",
        name: "Ocean Navigator",
        ship_type: "Bulk Carrier",
        length_m: 280.3,
        width_m: 38.5,
        draft_m: 14.8,
        gross_tonnage: 38000,
        flag: "Liberia",
        home_port: "Hamburg",
        owner: "Global Maritime Ltd.",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        imo_number: "IMO3456789",
        name: "Sea Voyager",
        ship_type: "Tanker",
        length_m: 320.7,
        width_m: 45.2,
        draft_m: 16.5,
        gross_tonnage: 52000,
        flag: "Marshall Islands",
        home_port: "Singapore",
        owner: "Pacific Tankers Inc.",
        status: "maintenance",
        created_at: new Date(),
        updated_at: new Date()
    }
]);

db.cargo.insertMany([
    {
        ship_id: "IMO1234567",
        cargo_type: "Containers",
        description: "Mixed cargo containers",
        weight_kg: 25000,
        volume_m3: 1200,
        units: 150,
        hazardous: false,
        customs_status: "cleared",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        ship_id: "IMO2345678",
        cargo_type: "Grain",
        description: "Wheat and corn",
        weight_kg: 35000,
        volume_m3: 2800,
        units: 1,
        hazardous: false,
        customs_status: "pending",
        created_at: new Date(),
        updated_at: new Date()
    }
]);

db.routes.insertMany([
    {
        ship_id: "IMO1234567",
        origin_port: "Rotterdam",
        destination_port: "Shanghai",
        departure_time: new Date("2024-01-15T08:00:00Z"),
        arrival_time: new Date("2024-02-10T16:00:00Z"),
        status: "scheduled",
        distance_nm: 8500,
        estimated_duration_hours: 624,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        ship_id: "IMO2345678",
        origin_port: "Hamburg",
        destination_port: "Buenos Aires",
        departure_time: new Date("2024-01-20T10:00:00Z"),
        arrival_time: new Date("2024-02-25T14:00:00Z"),
        status: "scheduled",
        distance_nm: 7200,
        estimated_duration_hours: 528,
        created_at: new Date(),
        updated_at: new Date()
    }
]);

db.port_operations.insertMany([
    {
        ship_id: "IMO1234567",
        operation_type: "loading",
        start_time: new Date("2024-01-14T06:00:00Z"),
        end_time: new Date("2024-01-15T06:00:00Z"),
        status: "completed",
        berth_number: "A5",
        crane_count: 3,
        priority: 1,
        notes: "Container loading operation completed successfully",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        ship_id: "IMO3456789",
        operation_type: "maintenance",
        start_time: new Date("2024-01-10T08:00:00Z"),
        end_time: new Date("2024-01-25T18:00:00Z"),
        status: "in_progress",
        berth_number: "M2",
        crane_count: 0,
        priority: 3,
        notes: "Engine maintenance and hull inspection",
        created_at: new Date(),
        updated_at: new Date()
    }
]);

// Create user with admin role
db.users.insertOne({
    auth0_id: "auth0|admin123",
    email: "admin@porttrack.com",
    first_name: "Admin",
    last_name: "User",
    role: "admin",
    department: "IT",
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
});

print("PortTrack MongoDB database initialized successfully!");
print("Collections created: ships, cargo, routes, port_operations, users, audit_logs");
print("Sample data inserted for testing");
print("Indexes created for optimal performance");
