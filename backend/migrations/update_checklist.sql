-- USE amazon_eptw_db;

-- Clear old questions for the target categories
DELETE FROM master_checklist_questions WHERE permit_type IN ('General', 'Hot_Work', 'Height', 'Confined_Space', 'Electrical');

-- General
INSERT INTO master_checklist_questions (permit_type, category, question_text, response_type, is_mandatory, display_order, is_active) VALUES
('General', 'Control Measures', 'Job Site Checked', 'radio', 1, 1, 1),
('General', 'Control Measures', 'Area Cordoned', 'radio', 1, 2, 1),
('General', 'Control Measures', 'Caution Boards Displayed', 'radio', 1, 3, 1),
('General', 'Control Measures', 'ELCB for portable tools', 'radio', 1, 4, 1),
('General', 'Control Measures', 'PPE provided', 'radio', 1, 5, 1),
('General', 'Control Measures', 'Lifting tools certified', 'radio', 1, 6, 1),
('General', 'Control Measures', 'Supervision provided', 'radio', 1, 7, 1),
('General', 'Control Measures', 'Double earthing', 'radio', 1, 8, 1),
('General', 'Control Measures', 'Underground cables checked', 'radio', 1, 9, 1),
('General', 'Control Measures', 'Underground pipes checked', 'radio', 1, 10, 1),
('General', 'Control Measures', 'Others', 'radio', 1, 11, 1);

-- Hot Work
INSERT INTO master_checklist_questions (permit_type, category, question_text, response_type, is_mandatory, display_order, is_active) VALUES
('Hot_Work', 'Control Measures', 'Combustibles removed', 'radio', 1, 1, 1),
('Hot_Work', 'Control Measures', 'Sparks Isolated', 'radio', 1, 2, 1),
('Hot_Work', 'Control Measures', 'Check the guage pipes of gas cutter', 'radio', 1, 3, 1),
('Hot_Work', 'Control Measures', 'Flash Back Arrestor provided', 'radio', 1, 4, 1),
('Hot_Work', 'Control Measures', 'Fire fighting equipment provided', 'radio', 1, 5, 1),
('Hot_Work', 'Control Measures', 'Fire fighting team alerted', 'radio', 1, 6, 1),
('Hot_Work', 'Control Measures', 'Welding sets earthed', 'radio', 1, 7, 1),
('Hot_Work', 'Control Measures', 'Welding cables in good condition', 'radio', 1, 8, 1),
('Hot_Work', 'Control Measures', 'Adequate ventilation for fumes', 'radio', 1, 9, 1),
('Hot_Work', 'Control Measures', 'Fire watcher will leave 30 minutes after completion of task from work site', 'radio', 1, 10, 1),
('Hot_Work', 'Control Measures', 'Rubber mat provided', 'radio', 1, 11, 1),
('Hot_Work', 'Control Measures', 'Area barrication & Warning signs', 'radio', 1, 12, 1);

-- Electrical
INSERT INTO master_checklist_questions (permit_type, category, question_text, response_type, is_mandatory, display_order, is_active) VALUES
('Electrical', 'Hazardous energy control/ line breaking', 'Wire man License', 'radio', 1, 1, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'Supervisory License', 'radio', 1, 2, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'Approved A class Contractor', 'radio', 1, 3, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'Use proper Electrical approved PPE', 'radio', 1, 4, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'Deenergize Machine', 'radio', 1, 5, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'Remove fuse/Service/Area isolation', 'radio', 1, 6, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'Lockout the switch/Valve/Gate', 'radio', 1, 7, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'Tag Out the Switch/Valve/Gate', 'radio', 1, 8, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'Caution board display', 'radio', 1, 9, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'First Aider team to be alert', 'radio', 1, 10, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'Insulated tools to be used', 'radio', 1, 11, 1),
('Electrical', 'Hazardous energy control/ line breaking', 'Others', 'radio', 1, 12, 1);

-- Height
INSERT INTO master_checklist_questions (permit_type, category, question_text, response_type, is_mandatory, display_order, is_active) VALUES
('Height', 'Work at Height', 'Scaffolding Ladder should be Metallic', 'radio', 1, 1, 1),
('Height', 'Work at Height', 'Ladder Should be in working condition', 'radio', 1, 2, 1),
('Height', 'Work at Height', 'FRP ladder to be used', 'radio', 1, 3, 1),
('Height', 'Work at Height', 'Proper PPE to be used', 'radio', 1, 4, 1),
('Height', 'Work at Height', 'Bottom support must be ensure', 'radio', 1, 5, 1),
('Height', 'Work at Height', 'One attender or supervision required', 'radio', 1, 6, 1),
('Height', 'Work at Height', 'Area isolation and caution display', 'radio', 1, 7, 1),
('Height', 'Work at Height', 'In open check wind speed', 'radio', 1, 8, 1),
('Height', 'Work at Height', 'Instruction to not work in dark hours', 'radio', 1, 9, 1),
('Height', 'Work at Height', 'not to allow task in open where Rains, Fog or slippery surface are observed', 'radio', 1, 10, 1),
('Height', 'Work at Height', 'Usage of Roof lifeline', 'radio', 1, 11, 1),
('Height', 'Work at Height', 'Anchorage Point', 'radio', 1, 12, 1);

-- Confined Space
INSERT INTO master_checklist_questions (permit_type, category, question_text, response_type, is_mandatory, display_order, is_active) VALUES
('Confined_Space', 'Confined Space', 'LEL checking', 'text', 1, 1, 1),
('Confined_Space', 'Confined Space', 'Flame proof 12 Volt hand lamp provided', 'radio', 1, 2, 1),
('Confined_Space', 'Confined Space', 'Air ventilation-Forced', 'radio', 1, 3, 1),
('Confined_Space', 'Confined Space', 'O2- Enter final value', 'text', 1, 4, 1),
('Confined_Space', 'Confined Space', 'Caution board displayed', 'radio', 1, 5, 1),
('Confined_Space', 'Confined Space', 'Escape tools like -tripod stand provided', 'radio', 1, 6, 1),
('Confined_Space', 'Confined Space', 'Source of Communication', 'radio', 1, 7, 1),
('Confined_Space', 'Confined Space', 'service,area,energy isolation', 'radio', 1, 8, 1),
('Confined_Space', 'Confined Space', 'Rescue Team on alert', 'radio', 1, 9, 1);
