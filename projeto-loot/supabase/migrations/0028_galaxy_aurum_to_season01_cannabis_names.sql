-- Renomear série galaxy-aurum para season01 e trocar nomes para estilo canábico (Season 01)

-- 1. Collectibles (vessels): series = season01 + nomes/slugs canábicos
update collectibles_catalog
set series = 'season01', slug = 'piteira-bot', name = 'PITEIRA-BOT'
where slug = 'ferrox-warden';

update collectibles_catalog
set series = 'season01', slug = 'dichava-v2', name = 'DICHAVA v2'
where slug = 'mycelion-splicer';

update collectibles_catalog
set series = 'season01', slug = 'neblina-prime', name = 'NEBLINA-PRIME'
where slug = 'neuraxis-relay';

update collectibles_catalog
set series = 'season01', slug = 'bong-mancer', name = 'BONG-MANCER'
where slug = 'chromara-forge';

update collectibles_catalog
set series = 'season01', slug = 'papa-og-pro', name = 'PAPA-OG P.R.O.'
where slug = 'oblivis-oracle';

-- 2. Strains: nomes/slugs canábicos (os que tinham nome estilo galaxy-aurum)
update strains_catalog set slug = 'beck-011', name = 'Beck-011', description = 'Disposição de beck. Pilhado e atacando, mas descontrolado.', penalty = '-50%' where slug = 'neuro-common';
update strains_catalog set slug = 'bucha-generica', name = 'Bucha Genérica', description = 'Postura de bucha. Firme na defesa, mas lerda pra revidar.', penalty = '-50%' where slug = 'shell-common';
update strains_catalog set slug = 'larica-basica', name = 'Larica Básica', description = 'Larica de entrada. Morde o que vê, mas gasta mana demais.', penalty = '+2 Mana' where slug = 'psycho-common';

update strains_catalog set slug = 'capulho-silver', name = 'Capulho Silver', description = 'Disposição prateada. Rápido e agressivo, queima no fim.', penalty = '-40%' where slug = 'neuro-uncommon';
update strains_catalog set slug = 'hash-bronze', name = 'Hash Bronze', description = 'Postura importada. Denso e firme, lento pra reagir.', penalty = '-40%' where slug = 'shell-uncommon';
update strains_catalog set slug = 'larica-grudenta', name = 'Larica Grudenta', description = 'Morde e não solta. Suga vida do inimigo, cansa fácil.', penalty = '+1 Mana' where slug = 'psycho-uncommon';

update strains_catalog set slug = 'diesel-eletrico', name = 'Diesel Elétrico', description = 'Disposição explosiva. Ataca antes de piscar, se queima no processo.', penalty = '-30%' where slug = 'neuro-rare';
update strains_catalog set slug = 'luz-do-norte', name = 'Luz do Norte', description = 'Posturado e calmo. Ninguém passa sem permissão.', penalty = '-30%' where slug = 'shell-rare';
update strains_catalog set slug = 'gold-fumo', name = 'Gold Fumo', description = 'Larica dourada. Morde com estilo e drena energia.', penalty = '+1 Mana' where slug = 'psycho-rare';

update strains_catalog set slug = 'limao-overdrive', name = 'Limão Overdrive', description = 'Disposição cítrica e letal. Pilhado ao extremo, foca em matar.', penalty = '-20%' where slug = 'neuro-epic';
update strains_catalog set slug = 'kush-ancora', name = 'Kush Âncora', description = 'Postura de respeito absoluto. Firme como âncora.', penalty = '-20%' where slug = 'shell-epic';
update strains_catalog set slug = 'gelato-sanguinho', name = 'Gelato Sanguinho', description = 'Morde o inimigo pra curar o mestre. Perde um pouco de vida.', penalty = '-10% HP' where slug = 'psycho-epic';

update strains_catalog set slug = 'erva-mestra', name = 'Erva-Mestra', description = 'Disposição filosófica. Pilhado com sabedoria, ataque cirúrgico.', penalty = '-10%' where slug = 'neuro-legendary';
update strains_catalog set slug = 'barreira-roxa', name = 'Barreira Roxa', description = 'Postura real roxa. Respeito absoluto, quase inabalável.', penalty = '-10%' where slug = 'shell-legendary';
update strains_catalog set slug = 'sede-eterna', name = 'Sede Eterna', description = 'Larica perfeita. Morde, cura e não para. Puro instinto predador.', penalty = 'Sem Penalidade' where slug = 'psycho-legendary';
