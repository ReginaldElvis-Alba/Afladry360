export const idlFactory = ({ IDL }) => {
  const DataChunk = IDL.Record({
    'id' : IDL.Nat32,
    'temperature' : IDL.Text,
    'moisture_content' : IDL.Text,
    'humidity' : IDL.Text,
    'deviceId' : IDL.Text,
    'timestamp' : IDL.Text,
  });
  return IDL.Service({
    'fetch_data' : IDL.Func([], [IDL.Vec(DataChunk)], []),
    'save_data' : IDL.Func([DataChunk], [], []),
    'save_multiple' : IDL.Func([IDL.Vec(DataChunk)], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
