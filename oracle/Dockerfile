FROM container-registry.oracle.com/database/free:latest
ENV ORACLE_PWD {ORACLE_PWD}
ENV SOURCE_USER {SOURCE_USER}
COPY fonds10_2023-11-07.dmp /opt/backup/source.dmp
COPY create_user.sql /opt/oracle/scripts/startup/01_create_user.sql
COPY restore_data.sh /opt/oracle/scripts/startup/02_restore_data.sh