<?php

/**
 * SiamGroup V3.1 — BaseModel
 * 
 * แม่แบบ Model สำหรับ CRUD Operations
 * ทุก Model สืบทอดจาก Class นี้
 */

class BaseModel
{
    protected PDO $db;
    protected string $table;
    protected string $primaryKey = 'id';

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // ========================================
    // READ
    // ========================================

    /**
     * ค้นหาตาม Primary Key
     */
    public function find(int $id): ?array
    {
        $sql = "SELECT * FROM `{$this->table}` WHERE `{$this->primaryKey}` = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * ดึงทั้งหมด (พร้อม optional conditions)
     */
    public function getAll(array $conditions = [], string $orderBy = '', int $limit = 0, int $offset = 0): array
    {
        $sql = "SELECT * FROM `{$this->table}`";
        $params = [];

        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                if ($value === null) {
                    $where[] = "`{$key}` IS NULL";
                } else {
                    $where[] = "`{$key}` = :{$key}";
                    $params[$key] = $value;
                }
            }
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        if ($orderBy) {
            $sql .= " ORDER BY {$orderBy}";
        }

        if ($limit > 0) {
            $sql .= " LIMIT {$limit}";
            if ($offset > 0) {
                $sql .= " OFFSET {$offset}";
            }
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * ค้นหาตาม conditions (คืน 1 row)
     */
    public function findWhere(array $conditions): ?array
    {
        $results = $this->getAll($conditions, '', 1);
        return $results[0] ?? null;
    }

    /**
     * นับจำนวน
     */
    public function count(array $conditions = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM `{$this->table}`";
        $params = [];

        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                $where[] = "`{$key}` = :{$key}";
                $params[$key] = $value;
            }
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int)$stmt->fetchColumn();
    }

    // ========================================
    // CREATE
    // ========================================

    /**
     * สร้าง Record ใหม่
     */
    public function create(array $data): int
    {
        $columns = array_keys($data);
        $placeholders = array_map(fn($col) => ":{$col}", $columns);

        $sql = sprintf(
            "INSERT INTO `%s` (`%s`) VALUES (%s)",
            $this->table,
            implode('`, `', $columns),
            implode(', ', $placeholders)
        );

        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);
        return (int)$this->db->lastInsertId();
    }

    // ========================================
    // UPDATE
    // ========================================

    /**
     * อัปเดตตาม Primary Key
     */
    public function update(int $id, array $data): bool
    {
        $sets = [];
        $params = ['_id' => $id];

        foreach ($data as $key => $value) {
            $sets[] = "`{$key}` = :{$key}";
            $params[$key] = $value;
        }

        $sql = sprintf(
            "UPDATE `%s` SET %s WHERE `%s` = :_id",
            $this->table,
            implode(', ', $sets),
            $this->primaryKey
        );

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    // ========================================
    // DELETE
    // ========================================

    /**
     * ลบตาม Primary Key
     */
    public function delete(int $id): bool
    {
        $sql = "DELETE FROM `{$this->table}` WHERE `{$this->primaryKey}` = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Soft Delete (set is_active = 0)
     */
    public function softDelete(int $id): bool
    {
        return $this->update($id, ['is_active' => 0]);
    }

    // ========================================
    // RAW QUERY
    // ========================================

    /**
     * Execute raw SQL (สำหรับ Complex Queries)
     */
    public function query(string $sql, array $params = []): array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Execute raw SQL (สำหรับ INSERT/UPDATE/DELETE)
     */
    public function execute(string $sql, array $params = []): bool
    {
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }
}
