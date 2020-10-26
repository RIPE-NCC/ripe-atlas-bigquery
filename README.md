# RIPE Atlas data in Google BigQuery

## Background

[Google BigQuery](https://cloud.google.com/bigquery/) is a data warehousing
platform with an SQL interface on top to allow fast query-based access to data.

The [RIPE Atlas network measurement platform](https://atlas.ripe.net/) conducts
network measurements, and makes the results of those measurements available via
[the RIPE Atlas API](https://atlas.ripe.net/docs/api/v2/reference/) and [bulk
downloads](https://data-store.ripe.net/datasets/atlas-daily-dumps/).

The API provides some opportunities to filter data, but cannot offer
significant compute cycles for calculation. To provide more scope for computation
and analysis of this data, we are now storing RIPE Atlas data in Google BigQuery.

For background information on the service, please refer to
https://labs.ripe.net/tools/.

In particular, note that your usage of this data falls under the [RIPE Atlas
Terms and Conditions](https://atlas.ripe.net/legal/terms-conditions/).


## Datasets and data

In order to get started, you need a Google account, and you need a project to
run queries under. More information here:

* [Getting started](docs/gettingstarted.md)

If you just want to jump in: the public datasets are viewable from our public project:

https://console.cloud.google.com/bigquery?project=ripencc-atlas

Initially, we will offer two datasets: **samples**, and **measurements**.

### Samples

The **samples** dataset contains six tables with a static, 1% sample of recent measurement results. The tables are:

* ripencc-atlas.samples.dns ([schema](docs/measurements_dns.md))
* ripencc-atlas.samples.http ([schema](docs/measurements_http.md))
* ripencc-atlas.samples.ntp ([schema](docs/measurements_ntp.md))
* ripencc-atlas.samples.ping ([schema](docs/measurements_ping.md))
* ripencc-atlas.samples.sslcert ([schema](docs/measurements_sslcert.md))
* ripencc-atlas.samples.traceroute ([schema](docs/measurements_traceroute.md))

These are intended for you to test the service on trivial data volumes, to better understand what's in there quickly.

### Measurements

The **measurements** dataset contains six public views that are continuously updated
with public RIPE Atlas measurement results. Schemas are identical to the samples tables.

The six views are:

* ripencc-atlas.measurements.dns
* ripencc-atlas.measurements.http
* ripencc-atlas.measurements.ntp
* ripencc-atlas.measurements.ping
* ripencc-atlas.measurements.sslcert
* ripencc-atlas.measurements.traceroute

These tables contain measurement results starting from 1 January 2020.


## Tutorials

These documents are intended to help bootstrap folks into querying this data, but
they're definitely not everything you can do.


* [Determine minimum RTT from any probe to any measured RTT](docs/tutorial_min_pings.md)
* [Subclauses and iterating on query building](docs/tutorial_subclauses.md)
* [Cost efficiency](docs/tutorial_cost_efficiency.md): the important options to minimise or estimate query costs


## Feedback

We're hoping, after some time using this data, to learn more about how best to
structure it, what tables would be useful for us to generate on your behalf,
and how you're using it all.

If you have comments, questions, suggestions, or problems to report, please
email atlas-bq@ripe.net




