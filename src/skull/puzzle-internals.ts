/**
 * Build a pool of fake system-status lines where a sliding window of
 * `word.length` consecutive lines has first letters spelling `word`.
 *
 * Strategy: for each letter, pick one line from a small curated bank
 * whose first character matches. Prepend and append a handful of
 * filler lines whose first letters are NOT prefixes of the word, so
 * the acrostic only appears in one specific window.
 */

const CURATED: Record<string, string[]> = {
  A: ['ACK 0x1F', 'ALLOC 4096 OK', 'ARBITER ONLINE'],
  B: ['BOOT SEQ COMPLETE', 'BUS 0 LINK OK', 'BACKLOG FLUSHED'],
  C: ['CRC PASS', 'CHECKSUM VERIFIED', 'CORE 2 READY'],
  D: ['DMA CHANNEL OK', 'DECODE TABLE LOADED', 'DEADMAN RESET'],
  E: ['ECC SCRUB OK', 'ENTROPY POOL FULL', 'EXEC UNIT IDLE'],
  F: ['FETCH RING STABLE', 'FIRMWARE 11.4', 'FAN 1 2400 RPM'],
  G: ['GATE 3 CLOSED', 'GRID LOCK OK', 'GAIN NOMINAL'],
  H: ['HEARTBEAT 60 BPM', 'HASH TREE OK', 'HYPERVISOR LOAD'],
  I: ['INT TABLE LOADED', 'INJECT PORT OPEN', 'IRIS CALIBRATED'],
  J: ['JITTER 0.2 MS', 'JMP VECTOR OK', 'JTAG LINK UP'],
  K: ['KEY FOB DETECTED', 'KERNEL WARM', 'KRED TOKEN VALID'],
  L: ['LINK UP 1 GBPS', 'LATCH SET', 'LOG BUFFER 42%'],
  M: ['MEM BANK 3 OK', 'MUX 0 STABLE', 'MSG QUEUE DRAINED'],
  N: ['NODE 7 SYNC', 'NET ROUTE STATIC', 'NEXUS LINK HOT'],
  O: ['OSC TRIM OK', 'ORB 2 TRACKING', 'OPCODE CACHE WARM'],
  P: ['PSU 1 12.08V', 'PING 3 MS', 'PHASE LOCK OK'],
  Q: ['QUEUE DEPTH 0', 'QUARTZ STABLE', 'QUERY TABLE LOADED'],
  R: ['RAM SCRUB DONE', 'RNG SEEDED', 'RING 0 CLEAR'],
  S: ['SYS CLOCK 3.2 GHZ', 'STATUS NOMINAL', 'SCAN LINE 482'],
  T: ['TEMP 34C', 'TRACE BUFFER OK', 'TICK 0x3FA'],
  U: ['UART 0 READY', 'UPLINK STABLE', 'UUID VERIFIED'],
  V: ['VOLT 1.05V OK', 'VECTOR TABLE FIXED', 'VRM LOCK OK'],
  W: ['WDT FED', 'WRITE PROT OFF', 'WRAP COUNT 2'],
  X: ['XBAR ROUTED', 'XOR MASK OK', 'XTAL OK'],
  Y: ['Y-BUS ACK', 'YAW 0.0°', 'YIELD TICK OK'],
  Z: ['ZEROED PAGE 3', 'ZONE 1 ACTIVE', 'ZERO XING'],
};

// Lines whose first letter is deliberately outside the word to act as padding
const FILLER = ['··· IDLE ···', '>>> SYS OK', '### LINK FINE', '%%% NOP', '$$$ WAIT'];

export function buildAcrosticPool(word: string): string[] {
  const upper = word.toUpperCase();
  const pool: string[] = [];

  // A couple of filler lines at the start
  pool.push(FILLER[0], FILLER[1]);

  // One curated line per letter
  for (const ch of upper) {
    const bank = CURATED[ch];
    if (!bank) throw new Error(`No curated lines for letter: ${ch}`);
    pool.push(bank[0]);
  }

  // More filler lines at the end
  pool.push(FILLER[2], FILLER[3], FILLER[4]);

  return pool;
}
