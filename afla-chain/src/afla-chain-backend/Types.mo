module Types {
  public type DeviceId = Text;
  public type DataChunk = {
    id : Nat32;
    timestamp : Text;
    temperature : Text;
    humidity : Text;
    moisture_content : Text;
    // Additional sensor data (spectral channels and validity) from sensorDataModel
    spectral_data : {
      spectral_valid : Bool;
      ch0 : Nat32;
      ch1 : Nat32;
      ch2 : Nat32;
      ch3 : Nat32;
      ch4 : Nat32;
      ch5 : Nat32;
      ch6 : Nat32;
      ch7 : Nat32;
      ch8 : Nat32;
      ch9 : Nat32;
      ch10 : Nat32;
    };
  };
};
