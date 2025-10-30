export const idlFactory = ({ IDL }) => {
  const DataChunk = IDL.Record({
    'id' : IDL.Nat32,
    'temperature' : IDL.Text,
    'spectral_data' : IDL.Record({
      'ch0' : IDL.Nat32,
      'ch1' : IDL.Nat32,
      'ch2' : IDL.Nat32,
      'ch3' : IDL.Nat32,
      'ch4' : IDL.Nat32,
      'ch5' : IDL.Nat32,
      'ch6' : IDL.Nat32,
      'ch7' : IDL.Nat32,
      'ch8' : IDL.Nat32,
      'ch9' : IDL.Nat32,
      'spectral_valid' : IDL.Bool,
      'ch10' : IDL.Nat32,
    }),
    'moisture_content' : IDL.Text,
    'humidity' : IDL.Text,
    'timestamp' : IDL.Text,
  });
  return IDL.Service({
    'fetch_data' : IDL.Func([IDL.Text], [IDL.Vec(DataChunk)], ['query']),
    'upload_data' : IDL.Func([IDL.Text, IDL.Vec(DataChunk)], [], []),
  });
};
export const init = ({ IDL }) => { return []; };