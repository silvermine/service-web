# Changelog

All notable changes to this project will be documented in this file.
See [our coding standards][commit-messages] for commit guidelines.

### 0.1.1 (2023-12-03)


### Features

* actually run commands ([1b40bc7](https://github.com/silvermine/service-web/commit/1b40bc7adb7f6942876081539c9f82ff5e44ff50))
* add --start-at <service> flag for deploy target commands ([332eeea](https://github.com/silvermine/service-web/commit/332eeead2fb8b44815baac338e57ef1446b961f6))
* add config file schemas to use for validation ([22827c0](https://github.com/silvermine/service-web/commit/22827c0aa195c214a968bbd66ba0ed41e231842b))
* add conversion of config file schemas to types ([c958be7](https://github.com/silvermine/service-web/commit/c958be72d392588fc061b6f1f018c1fef65931c0))
* add list-env-groups command ([992af6f](https://github.com/silvermine/service-web/commit/992af6f21f8e40312c73033028603755cc77af10))
* add list-systems command ([9e550bd](https://github.com/silvermine/service-web/commit/9e550bdd4b3ded4b72b32e7479779687f2719917))
* add service root dir to list-targets output ([9a9e5df](https://github.com/silvermine/service-web/commit/9a9e5dfd1bce02958255a1fa20b08a797548ab4f))
* add some basic progress tracking ([ab52d53](https://github.com/silvermine/service-web/commit/ab52d53154f885098247b2b760b8809b1869488d))
* add structure to CLI commands ([faca625](https://github.com/silvermine/service-web/commit/faca625ac2a21da507309a7a7b0e5afd37c479dd))
* CLI script that works on the dist files for installation elsewhere ([1e9a89e](https://github.com/silvermine/service-web/commit/1e9a89e07ed4d366ee6e48315f26d22cd5cebfc1))
* deterministic service ordering ([b52e915](https://github.com/silvermine/service-web/commit/b52e915efd41c2b8abe95114f2f5e689f740d552))
* expose CLI when package is installed ([8a1f101](https://github.com/silvermine/service-web/commit/8a1f101c334cb34eb3c02def0e9777b9e9d682d3))
* generate Mermaid chart to show service dependencies ([8ef7206](https://github.com/silvermine/service-web/commit/8ef7206e59be29e07e4063a73e379f22a63bf1e8))
* MVP of web, sys, svc loading and dependency graphing ([2f4983d](https://github.com/silvermine/service-web/commit/2f4983d402c4d1115964dbd40c17e7de966e4966))
* restructure to support running commands for each deploy target ([2d043f7](https://github.com/silvermine/service-web/commit/2d043f74aed89ea0f6e025e8030e34d8ede14303))
* schema validator for use when loading config files ([fa16412](https://github.com/silvermine/service-web/commit/fa16412d13c4f1c465acbcbd39c3cf325ca13171))
* stub out a CLI project that uses core ([a6d261f](https://github.com/silvermine/service-web/commit/a6d261f6793ddc36a6e463d4dbc7da6216677042))


### Bug Fixes

* inherit stdio pipes from parent process ([ce41aea](https://github.com/silvermine/service-web/commit/ce41aead39cee62aed2c0cb9200776016c8dd5cd))
* JSON files used in code weren't included in build output ([88675c7](https://github.com/silvermine/service-web/commit/88675c73624849e5ef4a5fcd650eecdd427af0db))
* list-targets should list sys and svc names separately ([8264d9d](https://github.com/silvermine/service-web/commit/8264d9d0aa33a34174fe8df787dba61c006da238))
* make list command more intuitive with default options ([46eac82](https://github.com/silvermine/service-web/commit/46eac82a41b6a9f82b2988401c97ddddcb324348))
* service config should override web & system defaults ([bac99df](https://github.com/silvermine/service-web/commit/bac99df0b525809a588da6cbaa9e25cf2213b961))
* tsconfig was writing dist to wrong location ([51a9cf8](https://github.com/silvermine/service-web/commit/51a9cf816de6e1d28fee413ea5f885f0b001b90c))


[commit-messages]: https://github.com/silvermine/silvermine-info/blob/master/commit-history.md#commit-messages
