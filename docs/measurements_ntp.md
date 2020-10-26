## Notes on the NTP dataset

This is the NTP schema in our BigQuery tables. For more information on the raw data this is based upon, please also look at the [RIPE Atlas schema description](https://atlas.ripe.net/docs/data_struct/#v5000).

### Schema

```
+-----------------------------+-----------------+-----------------------------------------------------------------+
|        field_path           |   data_type     |    description                                                  |
+-----------------------------+-----------------+-----------------------------------------------------------------+
| af                          | INT64           | Address Family                                                  |
| ntp_version                 | INT64           |                                                                 |
| protoc                      | STRING          | Transport protocol. Always UDP                                  |
| prb_id                      | INT64           | RIPE Atlas probe ID                                             |
| last_time_synced            | INT64           | Discrepancy (seconds) between probe's clock and the RIPE Atlas  |
|                             |                 | controller's clock. The value -1 means unknown.                 |
| msm_id                      | INT64           | RIPE Atlas measurement id                                       |
| group_id                    | INT64           | RIPE Atlas measurement-group id                                 |
| src_addr                    | STRING          | IP Address of the interface used by RIPE Atlas probe            |
| src_addr_bytes              | BYTES           | value of the src_addr field as a bytes representation           |
| dst_addr                    | STRING          | IP address of the destination of the traceroute                 |
| dst_addr_bytes              | BYTES           | value of the dst_addr fiels as a bytes representation           |
| synth_addr                  | STRING          | IP address of the probe as synthesized by the RIPE Atlas        |
|                             |                 | controller                                                      |
| synth_addr_bytes            | BYTES           | value of the synth_addr field as a bytes representation         |
| start_time                  | TIMESTAMP       | start time of the measurement                                   |
| start_hour                  | INT64           | time hour of the day                                            |
| mode                        | STRING          | server                                                          |
| server_stratum              | INT64           | Number of NTP-hops away server is from reference clock, as      |
|                             |                 | indicated by NTP server (stratum -1: invalid; stratum 0:        |
|                             |                 | reference clocks; stratum 1: attached to stratum 0; stratum 2:  |
|                             |                 | queries stratum 1, etc)                                         |
| server_root_dispersion      | FLOAT64         | error between NTP server and reference clock (indicated by NTP  |
|                             |                 | server)                                                         |
| server_root_delay           | FLOAT64         | Total round-trip delay to the reference clock (indicated by NTP |
|                             |                 | server)                                                         |
| server_reference_time       | FLOAT64         | server's reference timestamp (in NTP time)                      |
| server_precision            | FLOAT64         | Precision of the server's clock in seconds (running time taken  |
|                             |                 | to read the clock), as indicated by the NTP server              |
| server_reference_clock      | STRING          | String indicating the source of the server's time signal        |
| leap_indicator              | INT64           | warning of an impending leap second. '-1' indicates the removal |
|                             |                 | of a second (i.e. 59 seconds), '1' indicates the addition of a  |
|                             |                 | second (61 seconds), 0 indicates no leap second. Null when      |
|                             |                 | unknown.                                                        |
| results                     | ARRAY<STRUCT<                                                                     |
|   results.offset            |   FLOAT64       | clock offset between client and server in seconds               |
|   results.rtt               |   FLOAT64       | Round-trip-time for this hop                                    |
|   results.origin_ntp_time   |   FLOAT64       | t0: NTP time the request was sent by the probe.                 |
|                             |                 | NTP time (epoch: 1900-01-01), not UNIX time                     |
|   results.receive_ntp_time  |   FLOAT64       | t1: NTP time the server received the request                    |
|   results.transmit_ntp_time |   FLOAT64       | t2: NTP time the server sent the response                       |
|   results.final_ntp_time    |   FLOAT64       | t3: NTP time the response from the server is received by the    |
|                             |                 | probe                                                           |
|   results.mode              |   STRING        |                                                                 |
|                             | >>              |                                                                 |
+-----------------------------+-----------------+-----------------------------------------------------------------+

```
