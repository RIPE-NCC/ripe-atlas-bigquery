## Notes on the SSL Cert dataset

This is the sslcert schema in our BigQuery tables. For more information on the raw data this is based upon, please also look at the [RIPE Atlas schema description](https://atlas.ripe.net/docs/data_struct/#v5000).

### Schema

```
+-------------------+---------------+--------------------------------------------------------------+
|    field_path     |   data_type   |   description                                                |
+-------------------+---------------+--------------------------------------------------------------+
| af                | INT64         | Address Family                                               |
| method            | STRING        | 'SSL' or 'TLS'                                               |
| prb_id            | INT64         | RIPE Atlas probe id                                          |
| last_time_synced  | INT64         | Discrepancy (seconds) between probe's clock and the RIPE     |
|                   |               | Atlas controller's clock. The value -1 means unknown.        |
| msm_id            | INT64         | RIPE Atlas measurement id                                    |
| group_id          | INT64         | RIPE Atlas measurement-group id                              |
| src_addr          | STRING        | IP address of the interface used by RIPE Atlas probe         |
| src_addr_bytes    | BYTES         | Value of the src_addr field as a bytes representation        |
| dst_addr          | STRING        | IP address of the destination                                |
| dst_addr_bytes    | BYTES         | Value of the dst_addr field as a bytes representation        |
| dst_name          | STRING        | Hostname of the target as used by the probe                  |
| synth_addr        | STRING        | IP address of the probe as synthesized by the RIPE Atlas     |
|                   |               | controller                                                   |
| synth_addr_bytes  | BYTES         | Value of the synth_addr field as a bytes representation      |
| start_time        | TIMESTAMP     | Start time of the measurement                                |
| start_hour        | INT64         | time hour of the day                                         |
| roundtrip_time    | FLOAT64       | Duration from start connecting to receiving the certificate  |
|                   |               | (in milliseconds)                                            |
| server_cipher     | STRING        | Cipher selected by the target (stringly hexadecimal)         |
| time_to_connect   | FLOAT64       | Duration from time to start to time to connect (over TCP) to |
|                   |               | the target (in milliseconds)                                 |
| time_to_resolve   | FLOAT64       | Duration for the DNS resolution process                      |
| certificate       | ARRAY<STRING> | Certificate                                                  |
| alert_level       | INT64         | Alert Level                                                  |
| alert_description | INT64         | Alert Description                                            |
+-------------------+---------------+--------------------------------------------------------------+

```
