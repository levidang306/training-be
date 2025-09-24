import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialCreate1719733243377 implements MigrationInterface {
  name = 'InitialCreate1719733243377';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`boards\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`project_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`lists\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`board_id\` int NOT NULL, \`position\` int NOT NULL DEFAULT '0', \`project_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`comments\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` varchar(36) NOT NULL, \`card_id\` varchar(255) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`cardId\` varchar(36) NULL, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`cards\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`list_id\` varchar(255) NOT NULL, \`cover\` varchar(255) NULL, \`priority\` enum ('low', 'medium', 'high') NOT NULL DEFAULT 'medium', \`due_date\` date NULL, \`listId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`card_members\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` varchar(36) NOT NULL, \`role\` int NOT NULL, \`cardId\` varchar(36) NULL, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`notifications\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` varchar(36) NOT NULL, \`user_id\` int NOT NULL, \`message\` text NOT NULL, \`type\` enum ('info', 'warning', 'error') NOT NULL DEFAULT 'info', \`data\` json NULL, \`is_read\` tinyint NOT NULL DEFAULT 0, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`name\` varchar(100) NULL, \`bio\` text NULL, \`avatarUrl\` varchar(255) NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`project_members\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` varchar(36) NOT NULL, \`role\` int NOT NULL, \`userId\` varchar(36) NULL, \`projectId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`projects\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `ALTER TABLE \`boards\` ADD CONSTRAINT \`FK_1542ae826c0dfeaf4c79e07fc57\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`lists\` ADD CONSTRAINT \`FK_03e08cf5e67db1d2208fab5eec8\` FOREIGN KEY (\`project_id\`) REFERENCES \`boards\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_e0d58e922daf1775d69a9965ad0\` FOREIGN KEY (\`cardId\`) REFERENCES \`cards\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_7e8d7c49f218ebb14314fdb3749\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`cards\` ADD CONSTRAINT \`FK_8e71fba12a609e08cf311fde6d9\` FOREIGN KEY (\`listId\`) REFERENCES \`lists\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`card_members\` ADD CONSTRAINT \`FK_e9143a029e920623c7928edb30b\` FOREIGN KEY (\`cardId\`) REFERENCES \`cards\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`card_members\` ADD CONSTRAINT \`FK_2727bc359bb88dca9236d2cb96e\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_692a909ee0fa9383e7859f9b406\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`project_members\` ADD CONSTRAINT \`FK_08d1346ff91abba68e5a637cfdb\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`project_members\` ADD CONSTRAINT \`FK_d19892d8f03928e5bfc7313780c\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`project_members\` DROP FOREIGN KEY \`FK_d19892d8f03928e5bfc7313780c\``);
    await queryRunner.query(`ALTER TABLE \`project_members\` DROP FOREIGN KEY \`FK_08d1346ff91abba68e5a637cfdb\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_692a909ee0fa9383e7859f9b406\``);
    await queryRunner.query(`ALTER TABLE \`card_members\` DROP FOREIGN KEY \`FK_2727bc359bb88dca9236d2cb96e\``);
    await queryRunner.query(`ALTER TABLE \`card_members\` DROP FOREIGN KEY \`FK_e9143a029e920623c7928edb30b\``);
    await queryRunner.query(`ALTER TABLE \`cards\` DROP FOREIGN KEY \`FK_8e71fba12a609e08cf311fde6d9\``);
    await queryRunner.query(`ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_7e8d7c49f218ebb14314fdb3749\``);
    await queryRunner.query(`ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_e0d58e922daf1775d69a9965ad0\``);
    await queryRunner.query(`ALTER TABLE \`lists\` DROP FOREIGN KEY \`FK_03e08cf5e67db1d2208fab5eec8\``);
    await queryRunner.query(`ALTER TABLE \`boards\` DROP FOREIGN KEY \`FK_1542ae826c0dfeaf4c79e07fc57\``);
    await queryRunner.query(`DROP TABLE \`projects\``);
    await queryRunner.query(`DROP TABLE \`project_members\``);
    await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`notifications\``);
    await queryRunner.query(`DROP TABLE \`card_members\``);
    await queryRunner.query(`DROP TABLE \`cards\``);
    await queryRunner.query(`DROP TABLE \`comments\``);
    await queryRunner.query(`DROP TABLE \`lists\``);
    await queryRunner.query(`DROP TABLE \`boards\``);
  }
}
