## Notes on the Ping dataset

This is the ping schema in our BigQuery tables. For more information on the raw data this is based upon, please also look at the [RIPE Atlas schema description](https://atlas.ripe.net/docs/data_struct/#v5000).

### Schema

```
+------------------------------+-----------------+-------------------------------------------------------------+
|         field_path           |  data_type      |  description                                                |
+------------------------------+-----------------+-------------------------------------------------------------+
| af                           | INT64           | Address Family                                              |
| prb_id                       | INT64           | RIPE Atlas probe ID                                         |
| last_time_synced             | INT64           | Discrepancy (seconds) between probe's clock and the RIPE    |
|                              |                 | Atlas controller's clock. The value -1 means unknown.       |
| msm_id                       | INT64           | RIPE Atlas measurement id                                   |
| group_id                     | INT64           | RIPE Atlas measurement-group id                             |
| src_addr                     | STRING          | IP Address of the interface used by RIPE Atlas probe        |
| src_addr_bytes               | BYTES           | value of the src_addr field as a bytes representation       |
| dst_addr                     | STRING          | IP address of the destination of the traceroute             |
| dst_addr_bytes               | BYTES           | value of the dst_addr fiels as a bytes representation       |
| synth_addr                   | STRING          | IP address of the probe as synthesized by the RIPE Atlas    |
|                              |                 | controller                                                  |
| synth_addr_bytes             | BYTES           | value of the synth_addr field as a bytes representation     |
| start_time                   | TIMESTAMP       | start time of the measurement                               |
| start_hour                   | INT64           | time hour of the day                                        |
| size                         | INT64           | size of the payload send in the ping                        |
| packets_sent                 | INT64           | Number of ICMP packets sent to destination                  |
| packets_received             | INT64           | Number of ICMP packets received from destination            |
| pings                        | ARRAY<STRUCT<   |                                                             |
|   pings.timeout              |   BOOL          | Timeout                                                     |
|   pings.error                |   BOOL          | Error received                                              |
|   pings.error_message        |   STRING        | Error message if error received                             |
|   pings.rtt                  |   FLOAT64       | Round-trip-time for this hop                                |
|   pings.reply_src_addr       |   STRING        | Source address if different from the source address in      |
|                              |                 | first reply                                                 |
|   pings.reply_src_addr_bytes |   BYTES         | Value of the reply_src_addr field as a bytes representation |
|   pings.ttl                  |   INT64         | Time-to-Live in the package received in this hop            |
|   pings.dup                  |   INT64         | Signals that the reply is a duplicate                       |
|                              | >>              |                                                             |
+------------------------------+---------------+---------------------------------------------------------------+
```
