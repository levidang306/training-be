import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoverUrlInBoardAndCard1719744799933 implements MigrationInterface {
  name = 'AddCoverUrlInBoardAndCard1719744799933';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`lists\` DROP COLUMN \`board_id\``);
    await queryRunner.query(`ALTER TABLE \`comments\` DROP COLUMN \`card_id\``);
    await queryRunner.query(`ALTER TABLE \`comments\` DROP COLUMN \`user_id\``);
    await queryRunner.query(`ALTER TABLE \`cards\` DROP COLUMN \`list_id\``);
    await queryRunner.query(`ALTER TABLE \`cards\` DROP COLUMN \`cover\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`user_id\``);
    await queryRunner.query(`ALTER TABLE \`boards\` ADD \`coverUrl\` varchar(255) NULL`);
    await queryRunner.query(`ALTER TABLE \`cards\` ADD \`position\` int NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE \`cards\` ADD \`coverUrl\` varchar(255) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`cards\` DROP COLUMN \`coverUrl\``);
    await queryRunner.query(`ALTER TABLE \`cards\` DROP COLUMN \`position\``);
    await queryRunner.query(`ALTER TABLE \`boards\` DROP COLUMN \`coverUrl\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` ADD \`user_id\` int NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`cards\` ADD \`cover\` varchar(255) NULL`);
    await queryRunner.query(`ALTER TABLE \`cards\` ADD \`list_id\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`comments\` ADD \`user_id\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`comments\` ADD \`card_id\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`lists\` ADD \`board_id\` int NOT NULL`);
  }
}
