UPDATE agendamento SET cliente_tel = 'desconhecido' WHERE cliente_tel IS NULL;

ALTER TABLE agendamento ALTER COLUMN cliente_tel SET NOT NULL;
