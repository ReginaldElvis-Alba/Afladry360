import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import T "Types";

/*
 * Simple implementation using a HashMap for device data storage and
 * a stable variable array for persistence across upgrades.
 */
persistent actor {
    // Stable storage for upgrades
    private var sensor_data : [(T.DeviceId, [T.DataChunk])] = [];
    
    // Runtime HashMap for fast access
    private transient let sensor_map = HashMap.HashMap<T.DeviceId, [T.DataChunk]>(
        10, Text.equal, Text.hash
    );

    // System upgrade hook to preserve data
    system func preupgrade() {
        let buf = Buffer.Buffer<(T.DeviceId, [T.DataChunk])>(sensor_map.size());
        for ((k,v) in sensor_map.entries()) {
            buf.add((k,v));
        };
        sensor_data := Buffer.toArray(buf);
    };

    // System recovery hook to restore data
    system func postupgrade() {
        for ((deviceId, chunks) in sensor_data.vals()) {
            sensor_map.put(deviceId, chunks);
        };
    };

    // Save a single data chunk for a device
    private func save_data(deviceId : Text, data : T.DataChunk) : async Bool {
        switch (sensor_map.get(deviceId)) {
            case (?existing) {
                // Append new data to existing array
                let updated = Array.append<T.DataChunk>(existing, [data]);
                sensor_map.put(deviceId, updated);
                // Update stable storage
                sensor_data := Array.map<(T.DeviceId, [T.DataChunk]), (T.DeviceId, [T.DataChunk])>(
                    sensor_data,
                    func((id, chunks)) {
                        if (id == deviceId) { (id, updated) }
                        else { (id, chunks) }
                    }
                );
                true;
            };
            case null {
                // Create new device entry with single data chunk
                sensor_map.put(deviceId, [data]);
                // Update stable storage
                sensor_data := Array.append(sensor_data, [(deviceId, [data])]);
                true;
            };
        };
    };

    // Upload multiple data chunks for a device
    public func upload_data(deviceId : Text, dataArray : [T.DataChunk]) : async () {
        var i = 0;
        while (i < dataArray.size()) {
            ignore await save_data(deviceId, dataArray[i]);
            i += 1;
        };
    };

    // Fetch all data for a device
    public query func fetch_data(deviceId : Text) : async [T.DataChunk] {
        switch (sensor_map.get(deviceId)) {
            case (?data) data;
            case null [];
        };
    };

};
