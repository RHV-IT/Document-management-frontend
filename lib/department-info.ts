export type DepartmentDefinition = {
  meaning: string
  responsibilities: string[]
  hrNote: string
}

type DepartmentDefinitionInput = {
  meaning: string
  responsibilities: string[]
  hrNote: string
}

const DEPARTMENT_DEFINITIONS: Record<string, DepartmentDefinitionInput> = {
  HR: {
    meaning: 'Human Resources manages the people side of the organization, including employee records, recruitment, onboarding, performance support, training, benefits, and workplace policies.',
    responsibilities: [
      'Maintain accurate employee records and personnel documentation',
      'Support recruitment, onboarding, transfers, promotions, and exits',
      'Guide managers and staff on policies, compliance, and employee relations',
      'Coordinate training, performance processes, and workforce planning'
    ],
    hrNote: 'For HR, this department is usually the owner of employee lifecycle records, policy documents, and people-management processes.'
  },
  FINANCE: {
    meaning: 'Finance manages money-related records, budgets, payments, invoices, financial controls, and reporting.',
    responsibilities: [
      'Process invoices, payments, and financial approvals',
      'Maintain budget, expenditure, and revenue records',
      'Support audits, reconciliations, and financial reporting',
      'Monitor financial controls and spending compliance'
    ],
    hrNote: 'For HR, Finance often owns payroll support, compensation records, benefits costing, and budget approvals for staffing.'
  },
  ACCOUNTS: {
    meaning: 'Accounts handles accounting records, ledgers, receivables, payables, reconciliations, and financial transaction documentation.',
    responsibilities: [
      'Record financial transactions and maintain ledgers',
      'Track receivables, payables, and account reconciliations',
      'Prepare supporting documents for audits and reviews',
      'Support timely payment and collection processes'
    ],
    hrNote: 'For HR, Accounts may manage payroll accounting, staff advances, reimbursements, and salary-related financial records.'
  },
  PAYROLL: {
    meaning: 'Payroll manages salary processing, deductions, allowances, payslips, tax records, and payment confirmations.',
    responsibilities: [
      'Process salaries, wages, deductions, and allowances',
      'Maintain payroll records and payment history',
      'Coordinate payroll changes with HR and Finance',
      'Generate payslips and payroll reports'
    ],
    hrNote: 'For HR, Payroll is closely linked to employment contracts, attendance, benefits, deductions, and compensation changes.'
  },
  IT: {
    meaning: 'Information Technology manages systems, devices, software, networks, access, security, and technical support.',
    responsibilities: [
      'Support users, devices, applications, and networks',
      'Manage access, accounts, permissions, and security controls',
      'Maintain system availability, backups, and technical documentation',
      'Investigate incidents and implement technical improvements'
    ],
    hrNote: 'For HR, IT supports HR systems, employee access, digital records, onboarding accounts, and data protection controls.'
  },
  ADMIN: {
    meaning: 'Administration coordinates day-to-day operational support, office processes, records, logistics, and internal communication.',
    responsibilities: [
      'Coordinate office operations and internal workflows',
      'Maintain administrative records and official correspondence',
      'Support meetings, schedules, logistics, and documentation',
      'Assist other departments with operational coordination'
    ],
    hrNote: 'For HR, Administration often supports employee documentation, office logistics, policy circulation, and internal communication.'
  },
  PROCUREMENT: {
    meaning: 'Procurement manages purchasing, vendor selection, purchase requests, quotations, contracts, and supplier documentation.',
    responsibilities: [
      'Process purchase requests and supplier quotations',
      'Maintain vendor records and procurement documentation',
      'Support tendering, approvals, and contract records',
      'Coordinate delivery and supplier performance documentation'
    ],
    hrNote: 'For HR, Procurement may handle recruitment agency documents, training vendor records, and staff welfare purchases.'
  },
  MEDICAL: {
    meaning: 'Medical covers clinical care, patient assessment, diagnosis, treatment planning, and medical documentation.',
    responsibilities: [
      'Assess patients and document clinical findings',
      'Create and update treatment plans and medical records',
      'Coordinate referrals, follow-ups, and clinical reports',
      'Maintain medical compliance and patient safety records'
    ],
    hrNote: 'For HR, Medical may require credential records, licensure tracking, duty rosters, and clinical staff competency documents.'
  },
  NURSING: {
    meaning: 'Nursing provides direct patient care, care coordination, monitoring, patient education, and nursing documentation.',
    responsibilities: [
      'Deliver and document patient care activities',
      'Monitor patient status and escalate concerns',
      'Coordinate care plans with clinical teams',
      'Maintain nursing notes, handovers, and care records'
    ],
    hrNote: 'For HR, Nursing records often include rosters, shift allocations, credentialing, training, and performance documentation.'
  },
  PHARMACY: {
    meaning: 'Pharmacy manages medicines, prescriptions, dispensing records, stock control, and medication safety documentation.',
    responsibilities: [
      'Process prescriptions and medication records',
      'Manage medicine stock, expiry, and storage documentation',
      'Support medication safety and audit trails',
      'Coordinate pharmaceutical supply records'
    ],
    hrNote: 'For HR, Pharmacy may require staff credentialing, controlled-drug responsibility records, and training compliance documentation.'
  },
  LAB: {
    meaning: 'Laboratory manages diagnostic testing, specimens, results, quality control, and lab safety records.',
    responsibilities: [
      'Process specimens and diagnostic test requests',
      'Record, verify, and release laboratory results',
      'Maintain quality control and equipment documentation',
      'Support lab safety, audits, and sample traceability'
    ],
    hrNote: 'For HR, Lab departments often need competency, certification, shift, and safety-training records.'
  },
  LABORATORY: {
    meaning: 'Laboratory manages diagnostic testing, specimens, results, quality control, and lab safety records.',
    responsibilities: [
      'Process specimens and diagnostic test requests',
      'Record, verify, and release laboratory results',
      'Maintain quality control and equipment documentation',
      'Support lab safety, audits, and sample traceability'
    ],
    hrNote: 'For HR, Lab departments often need competency, certification, shift, and safety-training records.'
  },
  RADIOLOGY: {
    meaning: 'Radiology manages imaging services, scan requests, imaging results, equipment records, and radiation safety documentation.',
    responsibilities: [
      'Process imaging requests and patient preparation records',
      'Capture, store, and share diagnostic images and reports',
      'Maintain equipment, safety, and quality-control documentation',
      'Coordinate imaging follow-up and clinical reporting'
    ],
    hrNote: 'For HR, Radiology may require radiation safety training, credentialing, rosters, and equipment competency records.'
  },
  QUALITY: {
    meaning: 'Quality ensures processes, services, and records meet required standards through audits, improvement plans, and compliance tracking.',
    responsibilities: [
      'Monitor compliance with standards and procedures',
      'Conduct audits, inspections, and quality reviews',
      'Track corrective actions and improvement plans',
      'Maintain quality manuals, reports, and evidence records'
    ],
    hrNote: 'For HR, Quality often owns policy compliance, staff training evidence, audit findings, and performance improvement records.'
  },
  COMPLIANCE: {
    meaning: 'Compliance ensures the organization follows laws, regulations, policies, ethics, and internal controls.',
    responsibilities: [
      'Track regulatory and policy compliance requirements',
      'Review incidents, risks, and corrective actions',
      'Maintain compliance evidence, reports, and approvals',
      'Support investigations and control improvements'
    ],
    hrNote: 'For HR, Compliance is key for employee conduct, disciplinary records, confidentiality, and policy acknowledgement tracking.'
  },
  SECURITY: {
    meaning: 'Security protects people, property, information, and assets through access control, monitoring, incident response, and safety procedures.',
    responsibilities: [
      'Monitor premises, assets, and access points',
      'Respond to incidents and maintain incident records',
      'Support access control and visitor documentation',
      'Coordinate safety checks and security reports'
    ],
    hrNote: 'For HR, Security may handle staff ID records, access authorizations, incident reports, and workplace safety documentation.'
  },
  STORES: {
    meaning: 'Stores manages inventory, stock movement, issuance, receiving, and warehouse documentation.',
    responsibilities: [
      'Receive, store, and issue stock items',
      'Maintain inventory, bin, and stock movement records',
      'Track low stock, expiry, and replenishment needs',
      'Support stock counts and audit reconciliation'
    ],
    hrNote: 'For HR, Stores may manage staff welfare items, uniforms, PPE, and inventory-related staff responsibility records.'
  },
  WAREHOUSE: {
    meaning: 'Warehouse manages storage, stock movement, dispatch, receiving, and inventory control for goods and materials.',
    responsibilities: [
      'Receive, store, pick, pack, and dispatch goods',
      'Maintain inventory and location records',
      'Track stock movement and reconcile physical counts',
      'Support logistics, audits, and safety checks'
    ],
    hrNote: 'For HR, Warehouse records may include staff assignments, safety training, PPE issuance, and shift documentation.'
  },
  MAINTENANCE: {
    meaning: 'Maintenance keeps facilities, equipment, utilities, and infrastructure working safely and reliably.',
    responsibilities: [
      'Inspect, repair, and maintain equipment and facilities',
      'Record maintenance requests, work orders, and completion status',
      'Support preventive maintenance schedules',
      'Maintain safety, asset, and compliance documentation'
    ],
    hrNote: 'For HR, Maintenance often requires technical competency records, safety training, rosters, and incident documentation.'
  },
  ENGINEERING: {
    meaning: 'Engineering manages technical systems, equipment, projects, designs, maintenance support, and technical documentation.',
    responsibilities: [
      'Plan, maintain, and improve technical systems',
      'Prepare engineering drawings, reports, and specifications',
      'Support equipment reliability and project documentation',
      'Coordinate technical risk assessments and safety controls'
    ],
    hrNote: 'For HR, Engineering needs certification, competency, safety training, and project responsibility records.'
  },
  BIOMEDICAL: {
    meaning: 'Biomedical Engineering manages medical equipment, calibration, maintenance, safety checks, and equipment lifecycle records.',
    responsibilities: [
      'Maintain and calibrate medical equipment',
      'Record service, repair, and preventive maintenance activities',
      'Support equipment safety checks and compliance audits',
      'Track asset history and equipment performance'
    ],
    hrNote: 'For HR, Biomedical Engineering requires staff competency, safety training, equipment responsibility, and maintenance records.'
  },
  HOUSEKEEPING: {
    meaning: 'Housekeeping maintains cleanliness, hygiene, environmental standards, and cleaning service records.',
    responsibilities: [
      'Perform cleaning, sanitation, and waste-support activities',
      'Maintain cleaning schedules and inspection records',
      'Support infection-control and safety procedures',
      'Track supplies, tasks, and service completion'
    ],
    hrNote: 'For HR, Housekeeping needs staff training, PPE records, rosters, safety briefings, and performance documentation.'
  },
  CATERING: {
    meaning: 'Catering manages food preparation, meal service, nutrition support, hygiene controls, and food service records.',
    responsibilities: [
      'Prepare and serve meals according to service standards',
      'Maintain hygiene, temperature, and menu records',
      'Track food stock, supplies, and service schedules',
      'Support dietary requirements and food safety checks'
    ],
    hrNote: 'For HR, Catering requires food safety training, health screening, rosters, and hygiene compliance records.'
  },
  TRANSPORT: {
    meaning: 'Transport manages vehicle movement, dispatch, driver records, trip logs, fuel records, and transport coordination.',
    responsibilities: [
      'Schedule and dispatch vehicles',
      'Maintain trip logs, driver records, and vehicle documentation',
      'Track fuel, maintenance, and transport requests',
      'Support safe and timely movement of people or goods'
    ],
    hrNote: 'For HR, Transport may manage driver credentials, duty rosters, training, incident reports, and vehicle responsibility records.'
  },
  LOGISTICS: {
    meaning: 'Logistics coordinates movement, storage, distribution, and tracking of goods, equipment, and services.',
    responsibilities: [
      'Plan and track movement of goods or equipment',
      'Coordinate suppliers, deliveries, and internal distribution',
      'Maintain dispatch, receipt, and inventory documentation',
      'Support stock availability and delivery performance'
    ],
    hrNote: 'For HR, Logistics may require staff assignment records, training, safety documentation, and delivery responsibility tracking.'
  },
  RECEPTION: {
    meaning: 'Reception is the first point of contact for visitors, callers, appointments, directions, and front-desk communication.',
    responsibilities: [
      'Receive visitors, calls, and enquiries',
      'Direct people to the correct department or staff member',
      'Maintain appointment, visitor, and communication records',
      'Support front-desk service and escalation processes'
    ],
    hrNote: 'For HR, Reception often handles visitor logs, staff directories, communication scripts, and service-quality records.'
  },
  FRONT_DESK: {
    meaning: 'Front Desk manages first-contact service, visitor handling, appointments, enquiries, and routing of people or requests.',
    responsibilities: [
      'Receive and guide visitors, callers, and enquiries',
      'Maintain appointment and visitor documentation',
      'Route requests to the correct department or staff member',
      'Support service standards and escalation procedures'
    ],
    hrNote: 'For HR, Front Desk records may include staff rosters, service training, visitor handling, and communication procedures.'
  },
  OPERATIONS: {
    meaning: 'Operations coordinates day-to-day service delivery, workflows, resources, performance tracking, and process improvement.',
    responsibilities: [
      'Coordinate daily operational activities and resources',
      'Monitor service performance and workflow bottlenecks',
      'Maintain operational reports, schedules, and process records',
      'Support improvements to efficiency, quality, and safety'
    ],
    hrNote: 'For HR, Operations often owns staffing plans, rosters, productivity records, and department performance documentation.'
  },
  MANAGEMENT: {
    meaning: 'Management provides leadership, decision-making, planning, performance oversight, and accountability for organizational goals.',
    responsibilities: [
      'Set priorities, plans, and performance expectations',
      'Review reports, risks, budgets, and service outcomes',
      'Approve policies, decisions, and resource allocation',
      'Lead teams and coordinate strategic improvements'
    ],
    hrNote: 'For HR, Management owns leadership accountability, approvals, staffing decisions, performance reviews, and policy direction.'
  },
  EXECUTIVE: {
    meaning: 'Executive provides senior leadership, governance, strategic direction, major approvals, and organizational oversight.',
    responsibilities: [
      'Set strategic direction and governance priorities',
      'Approve major policies, budgets, and organizational decisions',
      'Review performance, risk, and compliance outcomes',
      'Represent the organization at senior stakeholder level'
    ],
    hrNote: 'For HR, Executive records often include leadership decisions, appointments, policy approvals, and governance documentation.'
  },
  LEGAL: {
    meaning: 'Legal manages contracts, legal advice, disputes, regulatory matters, risk review, and legal documentation.',
    responsibilities: [
      'Review contracts, agreements, and legal documents',
      'Provide legal guidance and risk assessment',
      'Manage disputes, claims, and regulatory correspondence',
      'Maintain legal records, approvals, and evidence files'
    ],
    hrNote: 'For HR, Legal supports employment contracts, disciplinary matters, investigations, settlements, and policy compliance.'
  },
  AUDIT: {
    meaning: 'Audit independently reviews records, controls, processes, and compliance to identify risks and recommend improvements.',
    responsibilities: [
      'Review records, controls, and process compliance',
      'Identify risks, gaps, and improvement opportunities',
      'Prepare audit reports and follow-up actions',
      'Maintain audit evidence and management responses'
    ],
    hrNote: 'For HR, Audit may review personnel files, payroll controls, policy compliance, and staff access records.'
  },
  RECORDS: {
    meaning: 'Records manages creation, classification, storage, retrieval, retention, and disposal of organizational documents.',
    responsibilities: [
      'Classify, index, store, and retrieve records',
      'Maintain retention schedules and disposal approvals',
      'Support audit trails and record accuracy',
      'Ensure records are available to authorized users'
    ],
    hrNote: 'For HR, Records is central to personnel files, employment history, policy acknowledgements, and confidential employee documents.'
  },
  DOCUMENT_CONTROL: {
    meaning: 'Document Control manages controlled documents, versions, approvals, distribution, and document lifecycle governance.',
    responsibilities: [
      'Control document numbering, versions, and approvals',
      'Distribute current documents and withdraw obsolete versions',
      'Maintain revision history and approval evidence',
      'Support audits and document compliance checks'
    ],
    hrNote: 'For HR, Document Control is important for policies, SOPs, job descriptions, forms, and staff acknowledgement records.'
  },
  CLINICAL: {
    meaning: 'Clinical departments deliver direct patient care and maintain clinical records, treatment documentation, and care coordination.',
    responsibilities: [
      'Assess, treat, and monitor patients',
      'Maintain clinical notes and care plans',
      'Coordinate referrals, handovers, and follow-up care',
      'Support clinical governance and patient safety records'
    ],
    hrNote: 'For HR, Clinical departments need credentialing, licensure, rosters, competency, and continuing education records.'
  },
  EMERGENCY: {
    meaning: 'Emergency handles urgent care, rapid assessment, stabilization, triage, and time-critical clinical documentation.',
    responsibilities: [
      'Triage and assess urgent cases',
      'Stabilize patients and coordinate emergency response',
      'Maintain emergency care records and handovers',
      'Track incidents, referrals, and critical timelines'
    ],
    hrNote: 'For HR, Emergency requires emergency training, certification, roster coverage, incident records, and competency tracking.'
  },
  ICU: {
    meaning: 'Intensive Care manages critical patient monitoring, life-support care, specialist treatment, and high-risk clinical records.',
    responsibilities: [
      'Monitor and treat critically ill patients',
      'Maintain intensive care notes and care plans',
      'Coordinate specialist input and escalation',
      'Track critical observations, interventions, and outcomes'
    ],
    hrNote: 'For HR, ICU requires advanced competency, critical-care training, rosters, credentialing, and incident documentation.'
  },
  THEATRE: {
    meaning: 'Theatre manages surgical procedures, operating room readiness, surgical records, sterilization coordination, and perioperative documentation.',
    responsibilities: [
      'Prepare operating rooms and surgical equipment',
      'Support surgical procedures and patient safety checks',
      'Maintain theatre lists, surgical records, and handovers',
      'Coordinate sterilization and post-operative documentation'
    ],
    hrNote: 'For HR, Theatre needs surgical competency, credentialing, rosters, training, and safety compliance records.'
  },
  SURGERY: {
    meaning: 'Surgery manages operative care, surgical planning, procedure documentation, and post-operative follow-up.',
    responsibilities: [
      'Plan and perform surgical procedures',
      'Maintain surgical notes and patient consent records',
      'Coordinate theatre scheduling and post-operative care',
      'Track outcomes, complications, and follow-up actions'
    ],
    hrNote: 'For HR, Surgery requires surgeon credentialing, privileges, rosters, training, and procedure responsibility records.'
  },
  OBSTETRICS: {
    meaning: 'Obstetrics manages pregnancy, labour, delivery, postnatal care, and maternity-related clinical records.',
    responsibilities: [
      'Provide antenatal, labour, delivery, and postnatal care',
      'Maintain maternity clinical records and care plans',
      'Coordinate maternal risk assessment and referrals',
      'Track outcomes, incidents, and follow-up care'
    ],
    hrNote: 'For HR, Obstetrics requires maternity-care competency, rosters, training, and credentialing records.'
  },
  PAEDIATRICS: {
    meaning: 'Paediatrics manages healthcare for children, including assessment, treatment, growth monitoring, and child-specific records.',
    responsibilities: [
      'Assess and treat paediatric patients',
      'Maintain child health records and care plans',
      'Coordinate immunization, growth, and development documentation',
      'Support child safeguarding and referral processes'
    ],
    hrNote: 'For HR, Paediatrics requires child-care competency, safeguarding training, rosters, and credentialing records.'
  },
  ONCOLOGY: {
    meaning: 'Oncology manages cancer care, treatment planning, chemotherapy records, patient education, and specialist follow-up.',
    responsibilities: [
      'Assess and manage cancer patients',
      'Maintain treatment plans and chemotherapy documentation',
      'Coordinate multidisciplinary care and follow-up',
      'Track outcomes, adverse events, and patient education records'
    ],
    hrNote: 'For HR, Oncology requires specialist training, chemotherapy competency, rosters, and safety compliance records.'
  },
  CARDIOLOGY: {
    meaning: 'Cardiology manages heart-related assessment, diagnosis, treatment, monitoring, and cardiac care documentation.',
    responsibilities: [
      'Assess and manage cardiac patients',
      'Maintain cardiac investigations and treatment records',
      'Coordinate specialist follow-up and referrals',
      'Track outcomes, risks, and patient education'
    ],
    hrNote: 'For HR, Cardiology requires specialist competency, equipment training, rosters, and credentialing records.'
  },
  ORTHOPAEDICS: {
    meaning: 'Orthopaedics manages musculoskeletal conditions, injuries, rehabilitation coordination, and related clinical records.',
    responsibilities: [
      'Assess and treat bone, joint, muscle, and spine conditions',
      'Maintain orthopaedic clinical notes and care plans',
      'Coordinate imaging, therapy, surgery, and follow-up',
      'Track outcomes, mobility plans, and rehabilitation progress'
    ],
    hrNote: 'For HR, Orthopaedics requires specialty competency, rosters, training, and procedure responsibility records.'
  },
  PUBLIC_HEALTH: {
    meaning: 'Public Health focuses on population health, disease prevention, health promotion, surveillance, and community health records.',
    responsibilities: [
      'Monitor health trends and disease risks',
      'Plan health promotion and prevention programs',
      'Maintain surveillance, outreach, and program records',
      'Coordinate community health interventions and reports'
    ],
    hrNote: 'For HR, Public Health may require epidemiology training, outreach records, community engagement documentation, and program rosters.'
  },
  SALES: {
    meaning: 'Sales manages customer acquisition, revenue opportunities, quotations, sales documentation, and customer relationship records.',
    responsibilities: [
      'Identify and pursue sales opportunities',
      'Prepare quotations, proposals, and customer records',
      'Track leads, conversions, and revenue activity',
      'Coordinate customer follow-up and account documentation'
    ],
    hrNote: 'For HR, Sales may require commission records, targets, performance reviews, customer ownership, and training documentation.'
  },
  MARKETING: {
    meaning: 'Marketing manages brand communication, campaigns, promotions, market research, and customer engagement materials.',
    responsibilities: [
      'Plan campaigns and promotional activities',
      'Create and approve marketing materials',
      'Track campaign performance and audience engagement',
      'Maintain brand, market research, and communication records'
    ],
    hrNote: 'For HR, Marketing may manage staff communications, employer branding, campaign approvals, and training materials.'
  },
  CUSTOMER_SERVICE: {
    meaning: 'Customer Service handles enquiries, complaints, support requests, feedback, and service recovery documentation.',
    responsibilities: [
      'Respond to customer enquiries and support requests',
      'Log complaints, feedback, and resolutions',
      'Escalate issues to the correct department',
      'Track service quality and customer satisfaction'
    ],
    hrNote: 'For HR, Customer Service requires service training, escalation records, performance metrics, and conduct documentation.'
  },
  RESEARCH: {
    meaning: 'Research manages studies, data collection, analysis, ethics documentation, findings, and knowledge-sharing records.',
    responsibilities: [
      'Design and conduct research activities',
      'Maintain protocols, datasets, and analysis records',
      'Secure ethics approvals and consent documentation',
      'Prepare reports, publications, and knowledge outputs'
    ],
    hrNote: 'For HR, Research may require ethics training, qualifications, project assignments, and intellectual property records.'
  },
  TRAINING: {
    meaning: 'Training manages learning programs, staff development, training records, assessments, and competency tracking.',
    responsibilities: [
      'Plan and deliver training programs',
      'Maintain attendance, assessment, and completion records',
      'Track competency gaps and learning needs',
      'Support onboarding and continuous professional development'
    ],
    hrNote: 'For HR, Training is often central to onboarding, mandatory training, compliance evidence, and staff development plans.'
  }
}

const GENERIC_DEPARTMENT_DEFINITION: DepartmentDefinition = {
  meaning: 'This department represents a functional area of the organization. Use its stored description to confirm the exact purpose, scope, and document ownership for your workplace.',
  responsibilities: [
    'Process and manage documents assigned to this department',
    'Support department-level workflow, access, and accountability',
    'Maintain accurate records related to its operational area',
    'Coordinate with other departments when records cross functional boundaries'
  ],
  hrNote: 'For HR, confirm the department owner, reporting line, key responsibilities, staff roles, document types handled, and any compliance or confidentiality requirements.'
}

export function normalizeDepartmentKey(value?: string): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function getDepartmentDefinition(department?: { name?: string; code?: string; description?: string } | null): DepartmentDefinition {
  if (!department) return GENERIC_DEPARTMENT_DEFINITION

  const keys = [department.code, department.name].filter(Boolean).map(normalizeDepartmentKey)
  const definition = keys.map((key) => DEPARTMENT_DEFINITIONS[key]).find(Boolean)

  if (!definition) return GENERIC_DEPARTMENT_DEFINITION

  return {
    ...definition,
    responsibilities: department.description
      ? [department.description, ...definition.responsibilities]
      : definition.responsibilities
  }
}
