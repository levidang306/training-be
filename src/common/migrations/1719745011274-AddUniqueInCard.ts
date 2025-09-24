import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueInCard1719745011274 implements MigrationInterface {
  name = 'AddUniqueInCard1719745011274';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_eecb605a5748ab400533b5cada\` ON \`card_members\` (\`cardId\`, \`userId\`)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_eecb605a5748ab400533b5cada\` ON \`card_members\``);
  }
}
