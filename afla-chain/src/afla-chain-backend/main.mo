actor {
  import List "mo:base/List";
import T "Types";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";

//store sensor data in a linked list
stable var DataStore:List.List<T.DataChunk> = List.nil<T.DataChunk>();

//upload data to store
public func save_data(Data: T.DataChunk):async Result.Result<Nat32, Nat32>{
DataStore := List.push<DataChunk,DataStore);
};

//upload multiple data
public func save_multiple(Data:[T.DataChunk]):async Result.Result<Text, Text>{
for (DataChunk in Data.vals()){
save_data(DataChunk);
}
};

};
