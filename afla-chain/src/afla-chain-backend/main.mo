import List "mo:base/List";
import T "Types";

persistent actor {

  //store sensor data in a linked list
  var DataStore : List.List<T.DataChunk> = List.nil<T.DataChunk>();

  //upload data to store
  public func save_data(data : T.DataChunk) : async () {
    DataStore := List.push(data, DataStore);
  };

  //upload multiple data
  public func save_multiple(Data : [T.DataChunk]) : async () {
    for (dataChunk in Data.vals()) {
      await save_data(dataChunk);
    };
  };

  //fetch data
  public func fetch_data() : async [T.DataChunk] {
    return List.toArray(DataStore);
  }

};
