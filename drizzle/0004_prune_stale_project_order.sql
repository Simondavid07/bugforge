WITH cleaned AS (
  SELECT
    up."id",
    COALESCE(
      jsonb_agg(item.value ORDER BY item.ordinality) FILTER (
        WHERE jsonb_typeof(item.value) = 'number'
          AND EXISTS (
            SELECT 1
            FROM "projects" AS p
            WHERE p."id" = (item.value #>> '{}')::integer
          )
      ),
      '[]'::jsonb
    ) AS "projectOrder"
  FROM "userPreferences" AS up
  LEFT JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(up."projectOrder") = 'array' THEN up."projectOrder"
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS item(value, ordinality) ON TRUE
  GROUP BY up."id"
)
UPDATE "userPreferences" AS up
SET "projectOrder" = cleaned."projectOrder"
FROM cleaned
WHERE up."id" = cleaned."id"
  AND up."projectOrder" IS DISTINCT FROM cleaned."projectOrder";
