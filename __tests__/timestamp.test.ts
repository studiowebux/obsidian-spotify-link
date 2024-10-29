const input1 = "Testing Timestamp: {{ timestamp }}";
const input2 = "Testing Timestamp: {{ timestampz(HH:mm) }}";
const input3 = "Testing Timestamp: {{ timestamp(HH:mm) }}";
const input4 = "Testing Timestamp: {{ timestampz }}";

const output1 = input1.replace(
  /{{ timestamp }}|{{timestamp}}/g,
  `${new Date().toDateString()} - ${new Date().toLocaleTimeString()}`,
);
console.log("output1", output1);

const output2 = input2.replace(
  /{{ timestampz\(HH:mm\) }}|{{timestampz\(HH:mm\)}}/g,
  `${new Date().getUTCHours()}:${new Date().getUTCMinutes()}`,
);
console.log("output2", output2);

const output3 = input3.replace(
  /{{ timestamp\(HH:mm\) }}|{{timestamp\(HH:mm\)}}/g,
  `${new Date().getHours()}:${new Date().getMinutes()}`,
);
console.log("output3", output3);

const output4 = input4.replace(
  /{{ timestampz }}|{{timestampz}}/g,
  `${new Date().toISOString()}`,
);
console.log("output4", output4);
