package fr.wseduc.stats.services;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.time.LocalDateTime;

import org.entcore.common.validation.ValidationException;

import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.Utils;
import io.reactiverse.pgclient.PgPool;
import io.reactiverse.pgclient.PgRowSet;
import io.reactiverse.pgclient.Row;
import io.reactiverse.pgclient.Tuple;
import io.vertx.core.Handler;
import io.vertx.core.MultiMap;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

public class PGStatsService implements StatsService {

    private static final Logger log = LoggerFactory.getLogger(PGStatsService.class);

    private PgPool readPgPool;
    private final JsonObject allowedValues;
    private final String platformId;

	public PGStatsService(String platformId, JsonObject allowedValues) {
        if (allowedValues == null || allowedValues.isEmpty()) {
            this.allowedValues = Utils.loadFromResource("api-allowed-values.json");
        } else {
            this.allowedValues = allowedValues;
        }
        this.platformId = platformId;
    }

	@Override
	public void listStats(MultiMap params, Handler<Either<String, JsonArray>> handler) {
        try {
            final LocalDateTime from = LocalDateTime.parse(params.get("from"));
            final LocalDateTime to = (Utils.isNotEmpty(params.get("to"))) ? LocalDateTime.parse(params.get("to")) : LocalDateTime.now();
            final List<String> entityIds = params.getAll("entity");
            final String entityLevel = params.get("entitylevel");
            if (!allowedValues.getJsonArray("entities-levels").contains(entityLevel)) {
                handler.handle(new Either.Left<>("invalid.entity.level"));
                return;
            }
            final String selectUai = ("structure".equals(entityLevel)) ? "e.uai as uai, " : "";
            final Tuple t = Tuple.of(platformId, from, to);
            String query =
                    "SELECT e.name as entity_name, " + selectUai + " s.* " +
                    "FROM stats." + getTableName(params) + "s " +
                    "JOIN repository." + entityLevel + ("class".equals(entityLevel) ? "es" : "s") + " e on s." + entityLevel + "_id = e.id " +
                    "WHERE s.platform_id = $1 AND (s.date BETWEEN $2 AND $3) ";
            if (entityIds != null && !entityIds.isEmpty()) {
                query += "AND " + entityLevel + "_id IN " +
                IntStream.rangeClosed(4, entityIds.size() + 3).boxed()
                .map(i -> "$" + i).collect(Collectors.joining(",", "(", ")"));
                entityIds.stream().forEach(e -> t.addString(e));
            }
            if ("access".equals(params.get("indicator"))) {
                query += " AND access > 0 AND module IN " + allowedValues.getJsonArray("modules").stream()
                        .map(x -> x.toString()).collect(Collectors.joining("','", "('", "')"));
                if ("CONNECTOR".equals(params.get("type")) || "ACCESS".equals(params.get("type"))) {
                    t.addString(params.get("type"));
                    query += " AND type = $" + t.size();
                }
            }
            if ("structure".equals(entityLevel) && entityIds.size() > 1) {
                query += " ORDER BY date DESC, entity_name ASC ";
            }
            readPgPool.preparedQuery(query, t, ar -> {
                if (ar.succeeded()) {
                    final PgRowSet rows = ar.result();
                    final List<String> columns = rows.columnsNames();
                    final JsonArray res = new JsonArray();
                    for (Row row: rows) {
                        final JsonObject j = new JsonObject();
                        for (int i = 0; i < columns.size(); i++) {
                            final Object o = row.getValue(i);
                            if (o instanceof LocalDateTime) {
                                j.put(columns.get(i), o.toString());
                            } else if (o != null) {
                                j.put(columns.get(i), o);
                            } else {
                                j.putNull(columns.get(i));
                            }
                        }
                        res.add(j);
                    }
                    handler.handle(new Either.Right<>(res));
                } else {
                    log.error("Error querying stats ", ar.cause());
                    handler.handle(new Either.Left<>(ar.cause().getMessage()));
                }
            });
        } catch (Exception e) {
            handler.handle(new Either.Left<>(e.getMessage()));
        }
	}

	private String getTableName(MultiMap params) {
        final String indicator = params.get("indicator");
        final String entityLevel = params.get("entitylevel");
        final String frequency = params.get("frequency");
        if (!allowedValues.getJsonArray("indicators").contains(indicator) ||
                !allowedValues.getJsonArray("entities-levels").contains(entityLevel) ||
                !allowedValues.getJsonArray("frequencies").contains(frequency)) {
            throw new ValidationException("invalid.params");
        }
		return
                indicator + "_" + ("true".equals(params.get("device")) ? "device_" : "") +
                entityLevel + "_" + frequency + "s ";
	}

	public void setReadPgPool(PgPool readPgPool) {
		this.readPgPool = readPgPool;
	}

}
