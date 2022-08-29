#  Copyright 2021 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""
MSSQL lineage module
"""
from metadata.ingestion.source.database.lineage_source import LineageSource
from metadata.ingestion.source.database.mssql_query_parser import MssqlQueryParserSource
from metadata.utils.sql_queries import MSSQL_SQL_STATEMENT


class MssqlLineageSource(MssqlQueryParserSource, LineageSource):

    sql_stmt = MSSQL_SQL_STATEMENT

    filters = ""  # No filtering in the queries
