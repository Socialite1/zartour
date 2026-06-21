INSERT INTO public.locations (name, description, qr_code_id, points_reward, latitude, longitude, category) VALUES
('Limpopo Provincial Legislature','The seat of provincial government in Lebowakgomo where Limpopo laws are debated.','qr-lim-legislature',15,-24.2010,29.5490,'political'),
('Polokwane City Hall','Historic civic centre and seat of the Polokwane municipality.','qr-lim-cityhall',15,-23.9045,29.4689,'political'),
('Lebowakgomo Government Complex','Administrative hub housing key provincial departments.','qr-lim-govcomplex',15,-24.1970,29.5480,'political'),
('Sekhukhune District Municipality Office','Regional governance centre for the Sekhukhune district.','qr-lim-sekhukhune',15,-24.7700,29.8500,'political'),
('Mall of the North','One of Limpopo''s largest retail and commerce destinations.','qr-lim-mallnorth',15,-23.8460,29.4660,'economical'),
('Tzaneen Agricultural Hub','Heart of Limpopo''s fruit and subtropical farming economy.','qr-lim-tzaneenagri',15,-23.8330,30.1630,'economical'),
('Marula Processing Plant','Local enterprise turning marula fruit into oils, drinks and exports.','qr-lim-marula',15,-23.9400,31.1400,'economical'),
('Musina Border Trade Hub','Cross-border trade gateway between South Africa and Zimbabwe.','qr-lim-musina',15,-22.3500,30.0400,'economical'),
('Polokwane Industrial Park','Manufacturing and logistics centre driving local jobs.','qr-lim-industrial',15,-23.9300,29.4900,'economical'),
('Mapungubwe National Park','UNESCO World Heritage Site of an ancient African kingdom.','qr-lim-mapungubwe',20,-22.1900,29.3900,'cultural'),
('Dzata Ruins','Stone ruins of the historic Venda kingdom capital.','qr-lim-dzata',20,-22.9200,30.2500,'cultural'),
('Tshivhase Royal Cultural Village','Living Venda royal heritage village near Thohoyandou.','qr-lim-tshivhase',20,-22.9500,30.4800,'cultural'),
('Modjadji Rain Queen Royal Compound','Home of the legendary Balobedu Rain Queen dynasty.','qr-lim-modjadji',20,-23.6000,30.4000,'cultural'),
('Mthwakazi Heritage Grounds','Storytelling and craft grounds celebrating local traditions.','qr-lim-mthwakazi',20,-23.9100,29.4500,'cultural'),
('Magoebaskloof Adventure','Forest canopy tours, zip-lines and mountain trails.','qr-lim-magoebaskloof',15,-23.8500,29.9900,'leisure'),
('Debengeni Falls','Scenic waterfall and picnic spot in the Magoebaskloof forests.','qr-lim-debengeni',15,-23.8600,30.0500,'leisure'),
('Bela-Bela Hot Springs','Natural mineral hot springs and family resort.','qr-lim-belabela',15,-24.8800,28.2900,'leisure'),
('Tzaneen Dam','Watersports and lakeside relaxation in the Letaba valley.','qr-lim-tzaneendam',15,-23.8000,30.1800,'leisure'),
('Polokwane Game Reserve','City-edge reserve for game drives and walking trails.','qr-lim-gamereserve',15,-23.9400,29.4900,'leisure'),
('Lake Fundudzi','Sacred lake of the Venda people, steeped in legend.','qr-lim-fundudzi',20,-22.8800,30.3000,'spiritual'),
('Thathe Vondo Sacred Forest','Ancestral forest considered holy and protected by tradition.','qr-lim-thathevondo',20,-22.9100,30.3500,'spiritual'),
('ZCC Moria Holy City','Pilgrimage centre of the Zion Christian Church near Polokwane.','qr-lim-moria',20,-23.9200,29.7100,'spiritual'),
('Modimolle Sacred Mountain','Mountain of spirits revered in local cosmology.','qr-lim-modimolle',20,-24.7000,28.4000,'spiritual');

INSERT INTO public.quests (id, title, description, type, total_steps, icon, guide_id) VALUES
('b1000000-0000-0000-0000-000000000002','Seats of Power: Limpopo Political Trail','Visit the centres of government and traditional authority that shape Limpopo.','political',4,'🏛️','10bd8170-6b4f-448e-91ea-325a73125cb7'),
('b1000000-0000-0000-0000-000000000001','Engines of Growth: Limpopo Economy Quest','Discover the trade, farming and commerce hubs powering the province.','economical',5,'💰','10bd8170-6b4f-448e-91ea-325a73125cb7'),
('b1000000-0000-0000-0000-000000000003','Roots of Limpopo: Cultural Heritage Quest','Journey through royal villages, ancient ruins and living traditions.','cultural',5,'🪘','10bd8170-6b4f-448e-91ea-325a73125cb7'),
('b1000000-0000-0000-0000-000000000004','Limpopo Unwind: Leisure Trail','Relax across the province''s falls, springs, reserves and lakes.','leisure',5,'🏞️','10bd8170-6b4f-448e-91ea-325a73125cb7'),
('b1000000-0000-0000-0000-000000000005','Sacred Limpopo: Spiritual Pilgrimage','Walk the sacred mountains, lakes, forests and holy sites of Limpopo.','spiritual',4,'🕊️','10bd8170-6b4f-448e-91ea-325a73125cb7');

INSERT INTO public.quest_locations (quest_id, location_id, step_order)
SELECT q.quest_id::uuid, l.id, q.step_order FROM (VALUES
 ('b1000000-0000-0000-0000-000000000002','qr-lim-legislature',1),
 ('b1000000-0000-0000-0000-000000000002','qr-lim-cityhall',2),
 ('b1000000-0000-0000-0000-000000000002','qr-lim-govcomplex',3),
 ('b1000000-0000-0000-0000-000000000002','qr-lim-sekhukhune',4),
 ('b1000000-0000-0000-0000-000000000001','qr-lim-mallnorth',1),
 ('b1000000-0000-0000-0000-000000000001','qr-lim-tzaneenagri',2),
 ('b1000000-0000-0000-0000-000000000001','qr-lim-marula',3),
 ('b1000000-0000-0000-0000-000000000001','qr-lim-musina',4),
 ('b1000000-0000-0000-0000-000000000001','qr-lim-industrial',5),
 ('b1000000-0000-0000-0000-000000000003','qr-lim-mapungubwe',1),
 ('b1000000-0000-0000-0000-000000000003','qr-lim-dzata',2),
 ('b1000000-0000-0000-0000-000000000003','qr-lim-tshivhase',3),
 ('b1000000-0000-0000-0000-000000000003','qr-lim-modjadji',4),
 ('b1000000-0000-0000-0000-000000000003','qr-lim-mthwakazi',5),
 ('b1000000-0000-0000-0000-000000000004','qr-lim-magoebaskloof',1),
 ('b1000000-0000-0000-0000-000000000004','qr-lim-debengeni',2),
 ('b1000000-0000-0000-0000-000000000004','qr-lim-belabela',3),
 ('b1000000-0000-0000-0000-000000000004','qr-lim-tzaneendam',4),
 ('b1000000-0000-0000-0000-000000000004','qr-lim-gamereserve',5),
 ('b1000000-0000-0000-0000-000000000005','qr-lim-fundudzi',1),
 ('b1000000-0000-0000-0000-000000000005','qr-lim-thathevondo',2),
 ('b1000000-0000-0000-0000-000000000005','qr-lim-moria',3),
 ('b1000000-0000-0000-0000-000000000005','qr-lim-modimolle',4)
) AS q(quest_id, qr, step_order)
JOIN public.locations l ON l.qr_code_id = q.qr;