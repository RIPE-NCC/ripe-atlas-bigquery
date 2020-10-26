## Notes on the Traceroute dataset

This is the traceroute schema in our BigQuery tables. For more information on the raw data this is based upon, please also look at the [RIPE Atlas schema description](https://atlas.ripe.net/docs/data_struct/#v5000).

### Schema

```
+-----------------------+------------------+--------------------------------------------------------------+
|     field_path        |   data_type      |    description                                               |
+-----------------------+------------------+--------------------------------------------------------------+
| af                    | INT64            | Adress Family                                                |
| protoc                | STRING           | Protocol used for traceroute: TCP, UDP or ICMP               |
| prb_id                | INT64            | RIPE Atlas probe ID                                          |
| last_time_synced      | INT64            | Discrepancy (seconds) between probe's clock and the RIPE     |
|                       |                  | Atlas controller's clock. The value -1 means unknown.        |
| msm_id                | INT64            | RIPE Atlas measurement id                                    |
| group_id              | INT64            | RIPE Atlas measurement-group id                              |
| src_addr              | STRING           | IP Address of the interface used by RIPE Atlas probe         |
| src_addr_bytes        | BYTES            | value of the src_addr field as a bytes representation        |
| dst_addr              | STRING           | IP address of the destination of the traceroute              |
| dst_addr_bytes        | BYTES            | value of the dst_addr fiels as a bytes representation        |
| synth_addr            | STRING           | IP address of the probe as synthesized by the RIPE Atlas     |
|                       |                  | controller                                                   |
| synth_addr_bytes      | BYTES            | value of the synth_addr field as a bytes representation      |
| start_time            | TIMESTAMP        | start time of the measurement                                |
| end_time              | TIMESTAMP        | stop time of the measurement                                 |
| start_hour            | INT64            | time hour of the day                                         |
| size                  | INT64            | size of the payload send in the traceroute                   |
| dscp                  | INT64            | 6 bits, derived from ToS in the header of the sent IP        |
|                       |                  | packet, 0 when ToS header field is missing                   |
| ecn                   | INT64            | 2 bits, derived from ToS in the header of the sent IP        |
|                       |                  | Packet, 0 when 'tos' missing                                 |
| paris_id              | INT64            | variation for the Paris mode of traceroute, 0 means no Paris |
|                       |                  | traceroute ('classic' traceroute)                            |
| hops                  | ARRAY<STRUCT<    |                                                              |
|   hops.hop            |   INT64          | Number of the hop that was sent                              |
|   hops.hop_addr       |   STRING         | Source IP Address of the returned package                    |
|   hops.hop_addr_bytes |   BYTES          | field hop_addr as a bytes representation                     |
|   hops.rtt            |   FLOAT64        | round-trip-time for this hop                                 |
|   hops.edst           |   STRING         | Destination address in the packet that triggered the error   |
|                       |                  | ICMP if different from the target of the measurement         |
|   hops.err            |   STRING         | error ICMP:                                                  |
|                       |                  | 'N' (network unreachable,),                                  |
|                       |                  | 'H' (destination unreachable),                               |
|                       |                  | 'A' (administratively prohibited),                           |
|                       |                  | 'P' (protocol unreachable),                                  |
|                       |                  | 'p' (port unreachable)                                       |
|                       |                  | 'h' (beyond scope, from fw 4650).                            |
|                       |                  | Unrecognized error codes are represented as integers         |
|   hops.ttl            |   INT64          | Time-to-Live in the package received in this hop             |
|   hops.mtu            |   INT64          | path MTU from a packet too big ICMP                          |
|   hops.reply_size     |   INT64          | Size of the package received in this hop                     |
|   hops.dstoptsize     |   INT64          | Size of destination options header (IPv6 only)               |
|   hops.hbhoptsize     |   INT64          | size of hop-by-hop options header (IPv6 only)                |
|   hops.mss            |   INT64          | TCP flags in the received packet. Concatenated in the        |
|                       |                  | order 'F' (FIN), 'S' (SYN), 'R' (RST), 'P' (PSH), 'A' (ACK), |
|                       |                  | 'U' (URG) (TCP protocol only)                                |
|   hops.flags          |   STRING         | TCP maximum packet size in the received packet (TCP only)    |
|                       | >>               |                                                              |
+-----------------------+------------------+--------------------------------------------------------------+

```
