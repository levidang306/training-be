import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnnecessaryForeignkeyField1719736450627 implements MigrationInterface {
  name = 'RemoveUnnecessaryForeignkeyField1719736450627';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`boards\` DROP FOREIGN KEY \`FK_1542ae826c0dfeaf4c79e07fc57\``);
    await queryRunner.query(`ALTER TABLE \`lists\` DROP FOREIGN KEY \`FK_03e08cf5e67db1d2208fab5eec8\``);
    await queryRunner.query(`ALTER TABLE \`boards\` CHANGE \`project_id\` \`projectId\` varchar(36) NULL`);
    await queryRunner.query(`ALTER TABLE \`lists\` CHANGE \`project_id\` \`boardId\` varchar(36) NULL`);
    await queryRunner.query(`ALTER TABLE \`cards\` CHANGE \`due_date\` \`dueDate\` date NULL`);
    await queryRunner.query(`ALTER TABLE \`notifications\` CHANGE \`is_read\` \`isRead\` tinyint NOT NULL DEFAULT '0'`);
    await queryRunner.query(
      `ALTER TABLE \`boards\` ADD CONSTRAINT \`FK_074efe1a079786d8c076bf00fff\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`lists\` ADD CONSTRAINT \`FK_05460f5df61d54daeaf96c54c00\` FOREIGN KEY (\`boardId\`) REFERENCES \`boards\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`lists\` DROP FOREIGN KEY \`FK_05460f5df61d54daeaf96c54c00\``);
    await queryRunner.query(`ALTER TABLE \`boards\` DROP FOREIGN KEY \`FK_074efe1a079786d8c076bf00fff\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` CHANGE \`isRead\` \`is_read\` tinyint NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE \`cards\` CHANGE \`dueDate\` \`due_date\` date NULL`);
    await queryRunner.query(`ALTER TABLE \`lists\` CHANGE \`boardId\` \`project_id\` varchar(36) NULL`);
    await queryRunner.query(`ALTER TABLE \`boards\` CHANGE \`projectId\` \`project_id\` varchar(36) NULL`);
    await queryRunner.query(
      `ALTER TABLE \`lists\` ADD CONSTRAINT \`FK_03e08cf5e67db1d2208fab5eec8\` FOREIGN KEY (\`project_id\`) REFERENCES \`boards\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`boards\` ADD CONSTRAINT \`FK_1542ae826c0dfeaf4c79e07fc57\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
